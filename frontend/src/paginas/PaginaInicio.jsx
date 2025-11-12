import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { apiSecure } from '../api.jsx';

export default function PaginaInicio() {
  const { token, logout } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiSecure('/secure', token); // GET /usuarios/secure
        setUsuarios(data);
      } catch (err) {
        if (err.status === 401) {
          // token expirado/invalidado
          logout();
        } else {
          setError('Error cargando usuarios');
        }
      }
    })();
  }, [token, logout]);

  return (
    <div style={{ padding: 24 }}>
      <div className="d-flex justify-content-between align-items-center">
        <h1>Página de inicio</h1>
        <button className="btn btn-outline-secondary" onClick={logout}>Cerrar sesión</button>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <ul className="mt-3">
        {usuarios.map(u => (
          <li key={u._id}>{u.username} · {u.email}</li>
        ))}
      </ul>
    </div>
  );
}
