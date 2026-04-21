const STORAGE_KEY = 'kmath.settings'

const DEFAULTS = {
  activeProfile: null,
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

export function updateSettings(partial) {
  const next = { ...getSettings(), ...partial }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore write errors (private mode, quota, etc.)
  }
  return next
}
