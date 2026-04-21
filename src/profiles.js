import { getSettings, updateSettings } from './settings'

const PROFILE_PREFIX = 'kmath.profile.'

const DEFAULT_PROFILES = [
  { id: 'dad',  name: 'Dad',  emoji: '👨', color: 'indigo' },
  { id: 'kira', name: 'Kira', emoji: '👧', color: 'pink' },
  { id: 'test', name: 'Test', emoji: '🧪', color: 'emerald' },
]

const PROFILE_DEFAULTS = {
  settings: { group: 'school' },
  points: 0,
  sessions: [],
}

const COLORS = {
  indigo:  { text: 'text-indigo-600',  bgLight: 'bg-indigo-50',  border: 'border-indigo-200',  pill: 'bg-indigo-100 text-indigo-700' },
  pink:    { text: 'text-pink-600',    bgLight: 'bg-pink-50',    border: 'border-pink-200',    pill: 'bg-pink-100 text-pink-700' },
  emerald: { text: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-700' },
}

export function getProfileColors(color) {
  return COLORS[color] ?? COLORS.indigo
}

function profileKey(id) {
  return `${PROFILE_PREFIX}${id}`
}

function readProfile(id) {
  try {
    const raw = localStorage.getItem(profileKey(id))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeProfile(profile) {
  try {
    localStorage.setItem(profileKey(profile.id), JSON.stringify(profile))
  } catch {
    // ignore write errors
  }
}

/** One-time seed. Also migrates any legacy top-level `group` setting into Dad's profile. */
export function ensureSeeded() {
  const settings = getSettings()
  const legacyGroup = settings.group
  for (const seed of DEFAULT_PROFILES) {
    if (readProfile(seed.id)) continue
    const profile = {
      ...seed,
      ...PROFILE_DEFAULTS,
      settings: { ...PROFILE_DEFAULTS.settings },
    }
    if (seed.id === 'dad' && legacyGroup) {
      profile.settings.group = legacyGroup
    }
    writeProfile(profile)
  }
  if (legacyGroup !== undefined) {
    const { group: _drop, ...rest } = settings
    try {
      localStorage.setItem('kmath.settings', JSON.stringify(rest))
    } catch {
      // ignore
    }
  }
}

export function getAllProfiles() {
  ensureSeeded()
  return DEFAULT_PROFILES.map((p) => readProfile(p.id)).filter(Boolean)
}

export function getActiveProfileId() {
  return getSettings().activeProfile ?? null
}

export function setActiveProfileId(id) {
  updateSettings({ activeProfile: id })
}

export function getActiveProfile() {
  const id = getActiveProfileId()
  if (!id) return null
  return readProfile(id)
}

export function updateActiveProfileSettings(partialSettings) {
  const current = getActiveProfile()
  if (!current) return null
  const next = { ...current, settings: { ...current.settings, ...partialSettings } }
  writeProfile(next)
  return next
}

function localDateYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Build a session entry from a completed quiz result and append it to the active profile. */
export function logSessionFromResult(result) {
  const current = getActiveProfile()
  if (!current) return null

  const now = new Date()
  const moduleMap = {}
  for (const { module, attempts, timeMs } of result.completedProblems) {
    if (!moduleMap[module.id]) {
      moduleMap[module.id] = { id: module.id, label: module.label, attempted: 0, solved: 0, totalMs: 0 }
    }
    const s = moduleMap[module.id]
    s.attempted += attempts
    s.solved += 1
    s.totalMs += timeMs
  }
  const modules = Object.values(moduleMap).map((s) => ({
    id: s.id,
    label: s.label,
    attempted: s.attempted,
    solved: s.solved,
    avgTimeMs: s.solved > 0 ? Math.round(s.totalMs / s.solved) : 0,
  }))

  const group = result.completedProblems[0]?.module.group ?? current.settings.group
  const durationMs = result.completedProblems.reduce((sum, p) => sum + p.timeMs, 0)

  const entry = {
    date: localDateYMD(now),
    startedAt: now.toISOString(),
    group,
    score: result.score,
    completed: result.completedProblems.length,
    initialCount: result.initialCount,
    totalAttempts: result.totalAttempts,
    durationMs,
    modules,
  }

  const next = {
    ...current,
    points: (current.points ?? 0) + (entry.score ?? 0),
    sessions: [...(current.sessions ?? []), entry],
  }
  writeProfile(next)
  return next
}

export { localDateYMD }
