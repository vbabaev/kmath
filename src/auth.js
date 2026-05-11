import { apiGet, apiPost, ApiError } from './api'

export async function getAuthMe() {
  try {
    return await apiGet('/auth/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export async function getAuthConfig() {
  try {
    return await apiGet('/auth/config')
  } catch {
    return { oauth: false, devLogin: false }
  }
}

export async function devLogin(profileId) {
  return apiPost('/auth/dev-login', { profileId })
}

export async function logout() {
  await apiPost('/auth/logout')
}
