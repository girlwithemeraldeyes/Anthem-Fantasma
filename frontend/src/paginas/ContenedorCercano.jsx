import { useState } from "react";

export default function ContenedorCercano() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [tipo, setTipo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Obtener ubicación actual
  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => setError("No se pudo obtener tu ubicación")
    );
  };

  const buscar = async (e) => {
    e.preventDefault();
    setError("");
    setResultado(null);
    if (!lat || !lon) {
      setError("Introduce tu ubicación o usa el botón 'Usar mi ubicación'");
      return;
    }
    try {
      setLoading(true);
      const qs = new URLSearchParams({ lat, lon, tipo });
      const res = await fetch(`/contenedores/nearest?${qs.toString()}`);
      if (!res.ok) throw new Error("No se encontró contenedor cercano");
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
      <h2>Buscar contenedor más cercano</h2>
      <form onSubmit={buscar} style={{ display: "grid", gap: 10 }}>
        <label>
          Tipo de residuo:
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">(Todos)</option>
            <option value="ORGÁNICA">Orgánica</option>
            <option value="RESTO">Resto</option>
            <option value="ENVASES">Envases</option>
            <option value="VIDRIO">Vidrio</option>
            <option value="PAPELCARTÓN">Papel/Cartón</option>
          </select>
        </label>

        <label>
          Latitud:
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            step="0.000001"
          />
        </label>

        <label>
          Longitud:
          <input
            type="number"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            step="0.000001"
          />
        </label>

        <button type="button" onClick={usarMiUbicacion}>
          Usar mi ubicación
        </button>
        <button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {resultado && (
        <div style={{ marginTop: 30, border: "1px solid #ccc", borderRadius: 8, padding: 20 }}>
          <h3>Contenedor encontrado</h3>
          <p><strong>Tipo:</strong> {resultado.tipo}</p>
          <p><strong>Dirección:</strong> {resultado.direccion}</p>
          <p><strong>Distancia:</strong> {resultado.distanciaKm} km</p>
          <a
            href={resultado.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 10,
              padding: "8px 12px",
              background: "#007bff",
              color: "white",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            Ver ruta en Google Maps
          </a>

          {/* Mapa embebido */}
          <div style={{ marginTop: 20 }}>
            <iframe
              src={`https://www.google.com/maps?q=${resultado.lat},${resultado.lon}&z=16&output=embed`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
