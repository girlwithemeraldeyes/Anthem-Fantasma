const mongoose = require("mongoose");

const ContenedoresSchema = new mongoose.Schema(
  {
    codigo_interno_situado: { type: String, required: true }, // Código de identificación del punto
    tipo_contenedor: { type: String, required: true }, // Orgánica, Resto, Envases, Vidrio, PapelCartón
    modelo: String, // Clasificación de contenedor
    descripcion_modelo: String, // Tipo de contenedor (ej. soterrado, superficie)
    cantidad: Number, // Número de contenedores en el punto
    lote: String, // Lote o zona de gestión
    distrito: String, // Código del distrito
    barrio: String, // Código o nombre del barrio
    tipo_via: String, // Calle, plaza, etc.
    nombre: String, // Nombre de la vía
    numero: String, // Número de la vía
    coordenadaX: Number, // Coordenada UTM X (en cm)
    coordenadaY: Number, // Coordenada UTM Y (en cm)
  },
  {
    collection: "Contenedores",
  }
);

module.exports = mongoose.model("Contenedores", ContenedoresSchema);