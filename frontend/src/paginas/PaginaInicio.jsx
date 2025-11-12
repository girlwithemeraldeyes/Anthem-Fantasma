import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { apiSecure } from '../api.jsx';
import styles from './PaginaInicio.module.css';

export default function PaginaInicio() {
  const { token, logout } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiSecure('/secure', token);
        setUsuarios(data);
      } catch (err) {
        if (err.status === 401) logout();
        else setError('Error cargando usuarios');
      }
    })();
  }, [token, logout]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Página de inicio</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Acceso al módulo de residuos */}
          <Link to="/residuos" className={styles.logoutBtn}>
            Ver contenedor más cercano
          </Link>
          <button className={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <ul className={styles.userList}>
        {usuarios.map(u => (
          <li key={u._id} className={styles.userItem}>
            {u.username} · {u.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
