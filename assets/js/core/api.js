const API_ORIGIN = (window.__ENV && window.__ENV.API_BASE_URL) || window.TIER_API_BASE || 'http://localhost:81';
const API_BASE = API_ORIGIN.replace(/\/+$/, '') + '/api';

export async function apiGet(path) {
  const res = await fetch(API_BASE + path, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return parseResponse(res);
}

export async function apiPost(path, payload) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(res);
}

export async function apiPostForm(path, formData) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return parseResponse(res);
}

async function parseResponse(res) {
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
