// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PaginaIniciarSesion from './paginas/PaginaIniciarSesion.jsx';
import PaginaInicio from './paginas/PaginaInicio.jsx';
import { AuthProvider } from './AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/iniciar-sesion" element={<PaginaIniciarSesion />} />
          {/* Todo lo que cuelgue de ProtectedRoute requiere token */}
          <Route element={<ProtectedRoute />}>
            <Route path="/inicio" element={<PaginaInicio />} />
          </Route>
          <Route path="/" element={<Navigate to="/iniciar-sesion" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
