import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

function isTokenValid(token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token || !isTokenValid(token)) {
    return <Navigate to="/iniciar-sesion" replace />;
  }
  return children;
}
