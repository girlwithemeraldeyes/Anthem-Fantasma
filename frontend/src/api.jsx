const API_BASE = '/usuarios'; // importante: ruta relativa (Vite la proxya)

export async function iniciarSesion(username, password) {
  const res = await fetch(`${API_BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Credenciales inválidas');
  const data = await res.json();
  return data.message; // token
}

export async function apiSecure(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    const e = new Error('No autorizado'); e.status = 401; throw e;
  }
  if (!res.ok) throw new Error(`Error ${res.status}`);
  try { return await res.json(); } catch { return null; }
}
