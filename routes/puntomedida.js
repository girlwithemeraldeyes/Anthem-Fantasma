// routes/puntoMedida.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const jwt = require("jsonwebtoken");

// modelo
const PuntoMedida = require("../models/PuntoMedidaTrafico.js");

mongoose.set("strictQuery", false);


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
   ENDPOINTS PUNTOS DE MEDIDA
   ============================ */

/* GET /puntos -> lista puntos (público) */
router.get("/", async (req, res) => {
  try {
    const filtro = {};

    if (req.query.distrito) filtro.distrito = req.query.distrito;
    if (req.query.tipo_elem) filtro.tipo_elem = req.query.tipo_elem;

    const puntos = await PuntoMedida.find(filtro);
    res.status(200).json(puntos);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener puntos", detalle: err.message });
  }
});

/* GET /puntos/:id -> un punto por su id de sensor (público) */
router.get("/:id", async (req, res) => {
  try {
    const punto = await PuntoMedida.findOne({ idelem: req.params.idelem });
    if (!punto) {
      return res.status(404).json({ mensaje: "Punto no encontrado" });
    }
    res.status(200).json(punto);
  } catch (err) {
    res.status(500).json({ mensaje: "Error al obtener punto", detalle: err.message });
  }
});

/* POST /puntos -> crear punto (protegido) */
router.post("/", tokenVerify, async (req, res) => {
  try {
    const nuevo = await PuntoMedida.create(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === 11000) {
      // unique idelem
      return res.status(400).json({ mensaje: "Ya existe un punto con ese idelem" });
    }
    res.status(500).json({ mensaje: "Error al crear punto", detalle: err.message });
  }
});

/* PATCH /puntos/:id -> actualizar algunos campos (protegido) */
router.patch("/:id", tokenVerify, async (req, res) => {
  // solo estos campos se pueden tocar
  const permitidos = [
    "tipo_elem",
    "distrito",
    "cod_cent",
    "nombre",
    "utm_x",
    "utm_y",
    "longitud",
    "latitud"
  ];

  const claves = Object.keys(req.body);
  for (const c of claves) {
    if (!permitidos.includes(c)) {
      return res.status(400).json({ mensaje: `La propiedad '${c}' no se puede actualizar` });
    }
  }

  try {
    const actualizado = await PuntoMedida.findOneAndUpdate(
      { idelem: req.params.idelem },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(404).json({ mensaje: "Punto no encontrado" });
    }

    res.status(200).json({
      mensaje: "Punto actualizado correctamente",
      punto: actualizado
    });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al actualizar punto", detalle: err.message });
  }
});

/* DELETE /puntos/:id -> no permitido (opcional) */
router.delete("/:id", tokenVerify, (req, res) => {
  return res.status(405).json({ mensaje: "No se permite eliminar puntos de medida" });
});

module.exports = router;
