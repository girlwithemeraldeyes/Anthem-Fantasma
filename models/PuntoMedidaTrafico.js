const mongoose = require("mongoose");

const TrafficPointSchema = new mongoose.Schema(
  {
    idelem: { type: String, required: true, unique: true }, // <-- viene de la columna "id"
    tipo_elem: { type: String },                            // URB, M30...
    distrito: { type: String },                             // en el CSV aparece como número/código
    cod_cent: { type: String },                             // "27/09/1902..." 
    nombre: { type: String },                               // "Jose Ortega y Gasset..."
    utm_x: { type: Number },
    utm_y: { type: Number },
    longitud: { type: Number },                             // columna "longitud"
    latitud: { type: Number }                               // columna "latitud"
  },
  { timestamps: true }
);

module.exports = mongoose.model("PuntoMedidaTrafico", TrafficPointSchema);
