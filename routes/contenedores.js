// routes/contenedores.js
const express = require('express');
const router = express.Router();
const Contenedor = require('../models/Contenedor.js');

// ------------------------------
// Helpers
// ------------------------------
function toNumberLoose(v) {
  if (v === null || v === undefined) return NaN;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(',', '.').trim());
  return Number(v);
}

function getLatLng(doc) {
  const lat =
    toNumberLoose(doc.LATITUD) ??
    toNumberLoose(doc.latitud) ??
    toNumberLoose(doc.lat) ??
    NaN;

  const lon =
    toNumberLoose(doc.LONGITUD) ??
    toNumberLoose(doc.longitud) ??
    toNumberLoose(doc.lng) ??
    toNumberLoose(doc.lon) ??
    NaN;

  return { lat, lon };
}

function getTipo(doc) {
  return (
    doc.tipo_contenedor ||
    doc['Tipo Contenedor'] ||
    doc.tipo ||
    doc.Tipo ||
    ''
  );
}

function getDireccion(doc) {
  const base =
    doc.DIRECCION ||
    doc.direccion ||
    `${doc.tipo_via || ''} ${doc.nombre || ''} ${doc.numero || ''}`.trim() ||
    `${doc.Nombre || doc.NOMBRE || ''} ${doc['Número'] || doc.Numero || doc.NÚMERO || ''}`.trim();

  return (base || '').toString().trim();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (Math.PI / 180) * (lat2 - lat1);
  const dLon = (Math.PI / 180) * (lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((Math.PI / 180) * lat1) *
      Math.cos((Math.PI / 180) * lat2) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ------------------------------
// GET /nearest  => contenedor más cercano
// Ej: /api/contenedores/nearest?lat=40.424&lon=-3.695&tipo=ENVASES
// ------------------------------
router.get('/nearest', async (req, res) => {
  try {
    const lat = toNumberLoose(req.query.lat);
    const lon = toNumberLoose(req.query.lon);
    const tipo = (req.query.tipo || '').toString().trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'Parámetros lat y lon obligatorios' });
    }

    // --- Query tolerante al formato del tipo (mayúsculas/minúsculas/espacios) ---
    const query = {};
    if (tipo) {
      const rx = new RegExp(`^\\s*${escapeRegex(tipo)}\\s*$`, 'i');
      query.$or = [
        { 'tipo_contenedor': rx },
        { 'Tipo Contenedor': rx }
      ];
    }

    // Traemos documentos (lean para obtener todos los campos tal cual en BD)
    let docs = await Contenedor.find(query)
      .select('LATITUD LONGITUD DIRECCION tipo_via nombre numero Nombre NOMBRE Número tipo_contenedor')
      .lean();

    // Si con el tipo no sale nada, probamos sin filtro para no dejarte en blanco
    if (!docs.length && tipo) {
      docs = await Contenedor.find({})
        .select('LATITUD LONGITUD DIRECCION tipo_via nombre numero Nombre NOMBRE Número tipo_contenedor')
        .lean();
    }

    if (!docs.length) {
      return res.status(404).json({ error: 'No hay contenedores' });
    }

    let best = null;
    for (const d of docs) {
      const { lat: cLat, lon: cLon } = getLatLng(d);
      if (!Number.isFinite(cLat) || !Number.isFinite(cLon)) continue;
      const dist = haversineKm(lat, lon, cLat, cLon);
      if (!best || dist < best.distanceKm) {
        best = {
          id: d._id,
          tipo: getTipo(d),
          lat: cLat,
          lon: cLon,
          direccion: getDireccion(d),
          distanceKm: Number(dist.toFixed(3))
        };
      }
    }

    if (!best) {
      return res.status(404).json({ error: 'No se pudieron leer coordenadas válidas' });
    }

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${best.lat},${best.lon}&travelmode=walking`;
    return res.json({ ...best, googleMapsUrl: mapsUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ------------------------------
// GET /stats  => mini-resumen por tipo
// ------------------------------
router.get('/stats', async (_req, res) => {
  try {
    const agg = await Contenedor.aggregate([
      {
        $addFields: {
          tipoCanonico: { $ifNull: ['$tipo_contenedor', '$Tipo Contenedor'] }
        }
      },
      { $group: { _id: '$tipoCanonico', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.json(agg.map(x => ({ tipo: x._id || 'SIN_TIPO', total: x.total })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
