// Anthem/Upload/Multas.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// posibles carpetas (es que estaba duplicada datos_hpe)
const posiblesCarpetas = [
  path.resolve(__dirname, "../datos_hpe/Multas"),
  path.resolve(__dirname, "../datos_hpe/datos_hpe/Multas"),
];

let carpetaCsv = null;
for (const ruta of posiblesCarpetas) {
  if (fs.existsSync(ruta)) {
    carpetaCsv = ruta;
    break;
  }
}

if (!carpetaCsv) {
  throw new Error(
    "No se encontró la carpeta de CSV. Probé estas rutas:\n" +
      posiblesCarpetas.join("\n")
  );
}

// === configuración ===
const BATCH_SIZE = 1000;        // inserciones en bloques de 1.000
const MAX_DOCS_PER_FILE = 5000; // de cada CSV solo metemos 5.000

// ---------- helpers CSV ----------
function detectDelimiter(line) {
  const countComma = (line.match(/,/g) || []).length;
  const countSemi = (line.match(/;/g) || []).length;
  return countSemi > countComma ? ";" : ",";
}

// Limpieza de bytes nulos y espacios en cabeceras y valores (en este csv tenía este problema)
function sanitizeString(str) {
  return str.replace(/\0/g, "").trim();
}

function csvLineToObject(line, headers, delimiter) {
  const parts = line.split(delimiter);
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    const key = sanitizeString(headers[i]); // 🔧 limpia la cabecera
    const raw = parts[i] !== undefined ? parts[i] : "";
    const cleaned = sanitizeString(raw.replace(/^"(.*)"$/, "$1"));
    obj[key] = cleaned;
  }
  return obj;
}

// ---------- importación de un .csv ----------
async function importarArchivoCsv(rutaArchivo, collection, nombreArchivo) {
  console.log("Importando " + rutaArchivo + "...");

  const stream = fs.createReadStream(rutaArchivo, { encoding: "utf8" });
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let headers = null;
  let delimiter = ",";
  let batch = [];
  let totalArchivo = 0;
  let linea = 0;

  for await (const line of rl) {
    // si ya metimos los 5.000 de este archivo, paramos
    if (totalArchivo >= MAX_DOCS_PER_FILE) {
      console.log(
        `Límite por archivo (${MAX_DOCS_PER_FILE}) alcanzado en ${nombreArchivo}.`
      );
      break;
    }

    linea++;
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!headers) {
      delimiter = detectDelimiter(trimmed);
      // Limpieza de bytes nulos en cabeceras
      headers = trimmed
        .split(delimiter)
        .map((h) => sanitizeString(h));
      console.log("Cabeceras detectadas:", headers);
      console.log("Delimitador detectado:", delimiter);
      continue;
    }

    const doc = csvLineToObject(trimmed, headers, delimiter);
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      // puede que nos falten menos de 1.000 para llegar a 5.000
      const restanteArchivo = MAX_DOCS_PER_FILE - totalArchivo;
      const batchAInsertar =
        batch.length > restanteArchivo ? batch.slice(0, restanteArchivo) : batch;

      try {
        await collection.insertMany(batchAInsertar, { ordered: false });
        totalArchivo += batchAInsertar.length;
        console.log(
          `   [${nombreArchivo}] Insertados ${totalArchivo} docs... (línea ${linea})`
        );
      } catch (err) {
        console.error(
          `   ERROR insertando lote en ${nombreArchivo} (línea ${linea}):`,
          err.message
        );
      }

      // si ya llegamos a 5.000 en este archivo, salimos
      if (totalArchivo >= MAX_DOCS_PER_FILE) {
        console.log(
          `Límite por archivo (${MAX_DOCS_PER_FILE}) alcanzado en ${nombreArchivo}.`
        );
        return;
      }

      batch = [];
    }
  }

  // último batch si queda algo y aún no llegamos al límite
  if (batch.length > 0 && totalArchivo < MAX_DOCS_PER_FILE) {
    const restanteArchivo = MAX_DOCS_PER_FILE - totalArchivo;
    const batchAInsertar =
      batch.length > restanteArchivo ? batch.slice(0, restanteArchivo) : batch;

    try {
      await collection.insertMany(batchAInsertar, { ordered: false });
      totalArchivo += batchAInsertar.length;
      console.log(
        `   [${nombreArchivo}] Insertados ${totalArchivo} docs... (último batch)`
      );
    } catch (err) {
      console.error(
        `   ERROR insertando último lote en ${nombreArchivo}:`,
        err.message
      );
    }
  }

  console.log(
    `Terminado (o limitado) ${rutaArchivo}. Insertado de este archivo: ${totalArchivo}`
  );
}

// ---------- main ----------
async function main() {
  const uri = process.env.MONGODB_CLUSTER_URI;
  const dbName = process.env.MONGODB_DATABASE_NAME;

  if (!uri || !dbName) {
    throw new Error(
      "Falta MONGODB_CLUSTER_URI o MONGODB_DATABASE_NAME en el .env"
    );
  }

  await mongoose.connect(uri, { dbName });

  const collection = mongoose.connection.db.collection("Multas");

  console.log("Conectado a MongoDB");
  console.log("Base usada:", mongoose.connection.db.databaseName);
  console.log("Colección usada:", collection.collectionName);
  console.log("Carpeta datos (csv de Tráfico):", carpetaCsv);

  const archivos = fs.readdirSync(carpetaCsv);
  const archivosCsv = archivos.filter((f) =>
    f.toLowerCase().endsWith(".csv")
  );

  console.log("Archivos CSV encontrados:", archivosCsv);

  for (const archivo of archivosCsv) {
    const ruta = path.join(carpetaCsv, archivo);
    try {
      await importarArchivoCsv(ruta, collection, archivo);
    } catch (err) {
      console.error(`Error procesando ${archivo}:`, err);
      break;
    }
  }

  const totalEnColeccion = await collection.countDocuments();
  console.log("Documentos en la colección ahora:", totalEnColeccion);

  await mongoose.disconnect();
  console.log("Todo importado (5k por CSV).");
}

main().catch((err) => {
  console.error("Error al importar:", err);
  process.exit(1);
});
