import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PaginaIniciarSesion from './paginas/PaginaIniciarSesion.jsx';
import PaginaInicio from './paginas/PaginaInicio.jsx';
import { AuthProvider } from './AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/iniciar-sesion" element={<PaginaIniciarSesion />} />
          <Route
            path="/inicio"
            element={
              <ProtectedRoute>
                <PaginaInicio />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/iniciar-sesion" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
