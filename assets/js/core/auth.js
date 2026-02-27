import { apiGet, apiPost } from './api.js';

export async function requireAuth() {
  const me = await apiGet('/auth/me');
  if (!me.user) {
    window.location.href = './login.html';
    return null;
  }
  return me.user;
}

export async function login(email, password) {
  return apiPost('/auth/login', { email, password });
}

export async function logout() {
  return apiPost('/auth/logout', {});
}

export async function forgot(email) {
  return apiPost('/auth/forgot', { email });
}

export async function resetPassword(email, token, new_password) {
  return apiPost('/auth/reset', { email, token, new_password });
}
