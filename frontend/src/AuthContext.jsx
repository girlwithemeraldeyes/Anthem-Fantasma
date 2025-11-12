import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { iniciarSesion } from './api.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  async function login(username, password) {
    const tk = await iniciarSesion(username, password);
    setToken(tk);
    return tk;
  }

  function logout() {
    setToken(null);
  }

  const value = useMemo(() => ({ token, login, logout, isAuth: !!token }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
