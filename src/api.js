const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
const tokenKey = 'nexa-admin-token';
const userKey = 'nexa-admin-user';

export const apiUrl = (path) => `${apiBase}${path}`;
export const hasApi = Boolean(apiBase);
export const token = () => sessionStorage.getItem(tokenKey);
export const logout = () => { sessionStorage.removeItem(tokenKey); sessionStorage.removeItem(userKey); };
export const currentUser = () => sessionStorage.getItem(userKey);

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `请求失败（${response.status}）`);
  return body;
}

export async function login(username, password) {
  const result = await request('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  sessionStorage.setItem(tokenKey, result.access_token);
  sessionStorage.setItem(userKey, username);
}
export const list = (path) => request(`/api/admin/${path}`);
export const create = (path, value) => request(`/api/admin/${path}`, { method: 'POST', body: JSON.stringify(value) });
export const update = (path, value) => request(`/api/admin/${path}`, { method: 'PUT', body: JSON.stringify(value) });
export const remove = (path) => request(`/api/admin/${path}`, { method: 'DELETE' });
export const upload = (file) => { const form = new FormData(); form.append('file', file); return request('/api/admin/uploads', { method: 'POST', body: form }); };
export const listUsers = () => request('/api/admin/users');
export const createUser = (value) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(value) });
export const changePassword = (username, value) => request(`/api/admin/users/${encodeURIComponent(username)}/password`, { method: 'PUT', body: JSON.stringify(value) });
export const removeUser = (username) => request(`/api/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
