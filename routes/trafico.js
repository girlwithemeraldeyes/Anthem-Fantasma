// routes/trafico.js
var express = require("express");
var mongoose = require("mongoose");
var router = express.Router();
var debug = require("debug")("anthem:trafico");
var jwt = require("jsonwebtoken");

// Modelo de lecturas de tráfico
var TrafficReading = require("../models/Trafico.js");

mongoose.set("strictQuery", false);

// Middleware para verificar el token
function tokenVerify(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ ok: false, message: "Token requerido" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).json({ ok: false, message: "Token inválido" });
    }
    req.user = decoded;
    next();
  });
}

/* ============================
   ENDPOINTS LECTURAS TRÁFICO
   ============================ */

/* GET /trafico -> lista lecturas con filtros y paginación */
router.get("/", async function (req, res) {
  try {
    // ===== PAGINACIÓN =====
    const MAX_LIMIT = 200;
    let limit = parseInt(req.query.limit, 10);
    let skip = parseInt(req.query.skip, 10);

    if (isNaN(limit) || limit <= 0) limit = 100;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    if (isNaN(skip) || skip < 0) skip = 0;

    // ===== FILTROS =====
    const filtro = {};

    // 1) idelem / id
    if (req.query.id || req.query.idelem) {
      const valor = (req.query.id || req.query.idelem).toString();
      filtro.idelem = valor;
    }

    // 2) tipo_elem (URB / M30)
    if (req.query.tipo_elem) {
      filtro.tipo_elem = req.query.tipo_elem.toString();
    }

    // 3) rango de fechas (guardadas como STRING "YYYY-MM-DD HH:MM:SS")
    if (req.query.desde || req.query.hasta) {
      const rango = {};
      if (req.query.desde) rango.$gte = req.query.desde + " 00:00:00";
      if (req.query.hasta) rango.$lte = req.query.hasta + " 23:59:59";
      filtro.fecha = rango;
    }

    // 4) rango de intensidad
    if (req.query.intensidad_min || req.query.intensidad_max) {
      const r = {};
      if (req.query.intensidad_min) r.$gte = Number(req.query.intensidad_min);
      if (req.query.intensidad_max) r.$lte = Number(req.query.intensidad_max);
      filtro.intensidad = r;
    }

    // 5) rango de carga
    if (req.query.carga_min || req.query.carga_max) {
      const r = {};
      if (req.query.carga_min) r.$gte = Number(req.query.carga_min);
      if (req.query.carga_max) r.$lte = Number(req.query.carga_max);
      filtro.carga = r;
    }

    // ===== ORDENADO =====
    // por defecto: por fecha asc
    let sort = { fecha: 1 };
    // si el usuario pide ?sort=-fecha o ?sort=intensidad...
    if (req.query.sort) {
      const campo = req.query.sort;
      if (campo.startsWith("-")) {
        sort = {};
        sort[campo.slice(1)] = -1;
      } else {
        sort = {};
        sort[campo] = 1;
      }
    }

    // ===== CONSULTA =====
    const lecturas = await TrafficReading.find(filtro)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TrafficReading.countDocuments(filtro);

    res.status(200).json({
      total,
      count: lecturas.length,
      skip,
      limit,
      data: lecturas,
    });
  } catch (err) {
    console.error("Error en GET /trafico:", err);
    res.status(500).json({ mensaje: "Error al obtener las lecturas" });
  }
});

/* GET /trafico/:idelem -> devuelve las lecturas de un punto concreto */
router.get("/:idelem", async function (req, res) {
  try {
    const idelem = req.params.idelem.toString();
    const lecturas = await TrafficReading.find({ idelem }).lean();

    if (!lecturas || lecturas.length === 0) {
      return res.status(404).json({ mensaje: "Lecturas no encontradas para ese punto" });
    }

    res.status(200).json(lecturas);
  } catch (err) {
    console.error("Error en GET /trafico/:idelem:", err);
    res.status(500).json({ mensaje: "Error al obtener la lectura" });
  }
});

/* POST /trafico -> crea una nueva lectura (protegido) */
router.post("/", tokenVerify, function (req, res) {
  TrafficReading.create(req.body)
    .then(function (nuevaLectura) {
      res.status(201).json(nuevaLectura);
    })
    .catch(function (err) {
      if (err.name === "ValidationError") {
        return res
          .status(400)
          .json({ mensaje: "Validación fallida", detalles: err.errors });
      }
      res.status(500).send(err);
    });
});

/* PATCH /trafico/:idelem -> actualiza parcialmente una lectura (protegido) */
router.patch("/:idelem", tokenVerify, function (req, res) {
  const campos = [
    "idelem",
    "fecha",
    "tipo_elem",
    "intensidad",
    "ocupacion",
    "carga",
    "vmed",
    "error",
    "periodo_integracion",
  ];

  const clavesBody = Object.keys(req.body);

  for (let clave of clavesBody) {
    if (!campos.includes(clave)) {
      return res
        .status(400)
        .json({ mensaje: `La propiedad '${clave}' no existe en TrafficReading` });
    }
  }

  const update = {};
  for (let clave of clavesBody) {
    update[clave] = req.body[clave];
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ mensaje: "No hay campos para actualizar" });
  }


  TrafficReading.findByIdAndUpdate(
    req.params.idelem,
    { $set: update },
    { new: true, runValidators: true, context: "query" }
  )
    .then(function (lecturaActualizada) {
      if (!lecturaActualizada) {
        return res.status(404).json({ mensaje: "Lectura no encontrada" });
      }
      res.status(200).json({
        mensaje: "Lectura actualizada correctamente",
        lectura: lecturaActualizada,
      });
    })
    .catch(function (err) {
      if (err.name === "ValidationError") {
        return res
          .status(400)
          .json({ mensaje: "Validación fallida", detalles: err.errors });
      }
      res
        .status(500)
        .json({ mensaje: "Error al actualizar", detalle: err.message });
    });
});

/* PUT /trafico/:idelem -> actualiza todos los campos de una lectura (protegido) */
router.put("/:idelem", tokenVerify, function (req, res) {
  const campos = [
    "idelem",
    "fecha",
    "tipo_elem",
    "intensidad",
    "ocupacion",
    "carga",
    "vmed",
    "error",
    "periodo_integracion",
  ];

  const clavesBody = Object.keys(req.body);

  if (clavesBody.length !== campos.length) {
    return res.status(400).json({ mensaje: "Faltan o sobran propiedades" });
  }

  for (let clave of clavesBody) {
    if (!campos.includes(clave)) {
      return res
        .status(400)
        .json({ mensaje: `La propiedad '${clave}' no existe en TrafficReading` });
    }
  }

  const update = {};
  for (let clave of clavesBody) {
    update[clave] = req.body[clave];
  }

  TrafficReading.findByIdAndUpdate(
    req.params.idelem,
    update,
    { new: true, runValidators: true, overwrite: true, context: "query" }
  )
    .then(function (lecturaNueva) {
      if (!lecturaNueva) {
        return res.status(404).json({ mensaje: "Lectura no encontrada" });
      }
      res.status(200).json({
        mensaje: "Lectura actualizada correctamente",
        lectura: lecturaNueva,
      });
    })
    .catch(function (err) {
      res.status(500).send(err);
    });
});

/* DELETE /trafico/:idelem -> elimina una lectura (protegido) */
router.delete("/:idelem", tokenVerify, function (req, res) {
  TrafficReading.findByIdAndDelete(req.params.idelem)
    .then(function (lecturaBorrada) {
      if (!lecturaBorrada) {
        return res.status(404).json({ mensaje: "Lectura no encontrada" });
      }
      res.status(200).json(lecturaBorrada);
    })
    .catch(function (err) {
      res.status(500).send(err);
    });
});

module.exports = router;

