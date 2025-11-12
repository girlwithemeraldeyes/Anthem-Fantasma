// app.js
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var debug = require('debug')('anthem:server');
var mongoose = require('mongoose');
require('dotenv').config();

// Importamos las rutas API
var usersRouter = require('./routes/usuarios');
var traficoRouter = require('./routes/trafico');
var puntoMedidaRouter = require("./routes/puntoMedida");

var app = express();

// Middlewares básicos
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Conexión a MongoDB
const MONGODB_CLUSTER_URI = process.env.MONGODB_CLUSTER_URI;
const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME;
const fullURI = `${MONGODB_CLUSTER_URI}/${MONGODB_DATABASE_NAME}?retryWrites=true&w=majority&appName=anthem`;

mongoose
  .connect(fullURI)
  .then(() => console.log('Conexión con MongoDB Atlas correcta'))
  .catch(err => console.error('Error al conectar con MongoDB:', err));

// Rutas de API
app.use('/usuarios', usersRouter);
app.use('/trafico', traficoRouter);
app.use('/movilidad/trafico/puntos', puntoMedidaRouter);

// ==== SERVIR FRONTEND REACT ====
const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));

// Fallback para SPA (todas las rutas que no sean de API)
app.get('*', (req, res) => {
  if (req.path.startsWith('/usuarios') || req.path.startsWith('/trafico') || req.path.startsWith('/movilidad')) {
    return res.status(404).end();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});
// ================================

// Manejo de errores 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Manejador de errores
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
