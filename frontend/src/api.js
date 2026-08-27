const BASE = 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const isFormData = body instanceof FormData;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: 'POST', body, token }),
  upload: (path, formData, token, method = 'POST') => request(path, { method, body: formData, token }),
  patch: (path, body, token) => request(path, { method: 'PATCH', body, token }),
  del: (path, token) => request(path, { method: 'DELETE', token }),
};
