// Identity-only client storage. The active profile id is what tells the
// app which profile to fetch from the backend on load. Everything else
// (state, points, sessions, etc.) lives in MongoDB.
const PROFILE_ID_KEY = 'klearn.profileId'
const LEGACY_PROFILE_ID_KEY = 'kmath.profileId'

export function getActiveProfileId() {
  try {
    // One-shot migration from the old kmath-prefixed key.
    const legacy = localStorage.getItem(LEGACY_PROFILE_ID_KEY)
    if (legacy && !localStorage.getItem(PROFILE_ID_KEY)) {
      localStorage.setItem(PROFILE_ID_KEY, legacy)
    }
    if (legacy) localStorage.removeItem(LEGACY_PROFILE_ID_KEY)
    return localStorage.getItem(PROFILE_ID_KEY)
  } catch {
    return null
  }
}

export function setActiveProfileId(id) {
  try {
    if (id) localStorage.setItem(PROFILE_ID_KEY, id)
    else localStorage.removeItem(PROFILE_ID_KEY)
  } catch {
    // ignore
  }
}

export function clearActiveProfileId() {
  setActiveProfileId(null)
}
