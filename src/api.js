const BASE = import.meta.env.VITE_API_BASE ?? '/api'

const FETCH_DEFAULTS = { credentials: 'include' }

export async function apiGet(path, options = {}) {
  const r = await fetch(BASE + path, { ...FETCH_DEFAULTS, signal: options.signal })
  if (r.status === 401) throw new ApiError('unauthenticated', 401)
  if (!r.ok) throw new ApiError(`GET ${path}: ${r.status}`, r.status, await r.text().catch(() => ''))
  return r.json()
}

export async function apiPut(path, body, options = {}) {
  const r = await fetch(BASE + path, {
    ...FETCH_DEFAULTS,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  })
  if (r.status === 401) throw new ApiError('unauthenticated', 401)
  if (!r.ok) throw new ApiError(`PUT ${path}: ${r.status}`, r.status, await r.text().catch(() => ''))
  return r.json()
}

export async function apiPost(path, body, options = {}) {
  const r = await fetch(BASE + path, {
    ...FETCH_DEFAULTS,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
  })
  if (r.status === 401) throw new ApiError('unauthenticated', 401)
  if (!r.ok) throw new ApiError(`POST ${path}: ${r.status}`, r.status, await r.text().catch(() => ''))
  if (r.status === 204) return null
  return r.json()
}

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.status = status
    this.detail = detail
  }
}
