const mongoose = require("mongoose");

const TrafficReadingSchema = new mongoose.Schema(
  {
    idelem: { type: String, required: true },
    fecha: { type: String, required: true },
    tipo_elem: String,
    intensidad: Number,
    ocupacion: Number,
    carga: Number,
    vmed: Number,
    error: String,
    periodo_integracion: Number,
  },
  {
    collection: "Trafico",
  }
);

module.exports = mongoose.model("Trafico", TrafficReadingSchema);
