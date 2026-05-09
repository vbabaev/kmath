const BASE = import.meta.env.VITE_API_BASE ?? '/api'
const PROFILE_ID_KEY = 'kmath.profileId'

function authHeaders() {
  const id = localStorage.getItem(PROFILE_ID_KEY)
  return id ? { 'X-Profile-Id': id } : {}
}

export async function apiGet(path, options = {}) {
  const r = await fetch(BASE + path, {
    headers: { ...authHeaders() },
    signal: options.signal,
  })
  if (!r.ok) throw new Error(`GET ${path}: ${r.status} ${await r.text().catch(() => '')}`)
  return r.json()
}

export async function apiPut(path, body, options = {}) {
  const r = await fetch(BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
    signal: options.signal,
  })
  if (!r.ok) throw new Error(`PUT ${path}: ${r.status} ${await r.text().catch(() => '')}`)
  return r.json()
}
