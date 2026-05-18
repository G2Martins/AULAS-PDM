const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL não definida. Crie .env e reinicie o Expo.');
}

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

function buildQS(filters = {}) {
  const entries = Object.entries(filters).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
}

export const api = {
  // Health
  health: () => request('/'),

  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  // Categorias
  listCategories: (filters) => request(`/categories${buildQS(filters)}`),
  createCategory: (payload) =>
    request('/categories', { method: 'POST', body: payload }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: 'PUT', body: payload }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Transações
  listTransactions: (filters) =>
    request(`/transactions${buildQS(filters)}`),
  getSummary: (filters) =>
    request(`/transactions/summary${buildQS(filters)}`),
  createTransaction: (payload) =>
    request('/transactions', { method: 'POST', body: payload }),
  updateTransaction: (id, payload) =>
    request(`/transactions/${id}`, { method: 'PUT', body: payload }),
  deleteTransaction: (id) =>
    request(`/transactions/${id}`, { method: 'DELETE' }),
};

export { API_URL };
