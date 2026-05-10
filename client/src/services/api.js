import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = await auth.currentUser?.getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getMe: () => request('/users/me'),
  saveProfile: (profile) => request('/users/me', { method: 'PUT', body: JSON.stringify(profile) }),
  updateLocation: (location) => request('/users/me/location', { method: 'PATCH', body: JSON.stringify(location) }),
  createDisaster: (payload) => request('/disasters', { method: 'POST', body: JSON.stringify(payload) }),
  updateDisaster: (id, payload) => request(`/disasters/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createTask: (payload) => request('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  acceptTask: (id, payload = {}) => request(`/tasks/${id}/accept`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignTask: (id, volunteerId) => request(`/tasks/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ volunteerId }) }),
  createResource: (payload) => request('/resources', { method: 'POST', body: JSON.stringify(payload) }),
  updateResource: (id, payload) => request(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteResource: (id) => request(`/resources/${id}`, { method: 'DELETE' })
};
