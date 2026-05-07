const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('EXPO_PUBLIC_API_URL não definida. Crie o arquivo .env e reinicie o Expo.');
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Categorias
  listCategories: (type) =>
    request(`/categories${type ? `?type=${type}` : ''}`),
  createCategory: (payload) =>
    request('/categories', { method: 'POST', body: payload }),
  updateCategory: (id, payload) =>
    request(`/categories/${id}`, { method: 'PUT', body: payload }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Transações
  listTransactions: (filters = {}) => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v != null && v !== ''),
    ).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
  },
  getSummary: () => request('/transactions/summary'),
  createTransaction: (payload) =>
    request('/transactions', { method: 'POST', body: payload }),
  updateTransaction: (id, payload) =>
    request(`/transactions/${id}`, { method: 'PUT', body: payload }),
  deleteTransaction: (id) =>
    request(`/transactions/${id}`, { method: 'DELETE' }),
};

export { API_URL };
