import axios from 'axios';

// Default to host:3002 because docker-compose maps backend -> host:3002 to
// avoid conflicts with host processes on 3001. You may override with
// VITE_API_URL in your environment (e.g. .env.local) if you run backend on
// a different port.
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/+$/, '');

// Normalize two logical bases:
// - rootBase: without a trailing `/api` segment (used by weather endpoints)
// - apiBase: with `/api` segment (used by auth/users endpoints)
const rootBase = API_BASE.replace(/\/api\/?$/i, '');
const apiBase = API_BASE.match(/\/api\/?$/i) ? API_BASE : `${rootBase}/api`;

export function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sunmap_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = axios.create({
  baseURL: rootBase,
  headers: { 'Content-Type': 'application/json' },
});

// instance for endpoints under /api (auth, users)
export const apiAuth = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  // Explicitly stringify the payload to ensure the request body is valid JSON
  login: (email: string, password: string) => apiAuth.post('/auth/login', JSON.stringify({ email, password }), { headers: { 'Content-Type': 'application/json' } }),
};

export const usersApi = {
  // list: (page = 1, limit = 10) => api.get(`/users?page=${page}&limit=${limit}`, { headers: authHeader() }),

  list: () => api.get(`/users`), //Com a Rota Weather nao retorna 404  
  create: (email: string, password: string) => apiAuth.post('/users', { email, password }),
};

export const weatherApi = {
  create: (payload: any) => api.post('/weather/logs', payload),
  // legacy: raw axios response
  list: (page = 1, limit = 20) => api.get(`/weather?page=${page}&limit=${limit}`),
  // normalized: returns array of records directly (handles different backend shapes)
  // include a cache-busting timestamp param to avoid browser/server 304 Not Modified
  // responses during active testing.
  getList: async (page = 1, limit = 50) => {
    const r = await api.get(`/weather`, { params: { page, limit, _ts: Date.now() } });
    // backend may return array directly or { data: [...] } or { data: { data: [...] } }
    const data = Array.isArray(r.data) ? r.data : (r.data?.data || r.data || []);
    return Array.isArray(data) ? data : [];
  },
  fetchExternal: (lat?: string, lon?: string) => api.get(`/weather/fetch?lat=${lat || ''}&lon=${lon || ''}`),
  summary: (hours = 6) => api.get(`/weather/summary?hours=${hours}`),
  // Request CSV as blob so frontend can trigger download
  exportCsv: (from?: string, to?: string) => api.get(`/weather/export?from=${from || ''}&to=${to || ''}`, { responseType: 'blob' }),
  exportXlsx: (from?: string, to?: string) => api.get(`/weather/export-xlsx?from=${from || ''}&to=${to || ''}`, { responseType: 'blob' }),
};
