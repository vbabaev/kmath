import { getSettings, updateSettings } from './settings'

const PROFILE_PREFIX = 'kmath.profile.'

const DEFAULT_PROFILES = [
  { id: 'dad',  name: 'Dad',  emoji: '👨', color: 'indigo',  role: 'teacher' },
  { id: 'kira', name: 'Kira', emoji: '👧', color: 'pink',    role: 'student' },
  { id: 'test', name: 'Test', emoji: '🧪', color: 'emerald', role: 'student' },
]

const PROFILE_DEFAULTS = {
  settings: { group: 'school' },
  points: 0,
  sessions: [],
  role: 'student',
  packages: [],
}

export const SHOP_PACKAGES = {
  '15min': { type: '15min', label: '15 iPad minutes', minutes: 15, cost: 300,  emoji: '📱' },
  '60min': { type: '60min', label: '60 iPad minutes', minutes: 60, cost: 1100, emoji: '⏰' },
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
    const existing = readProfile(seed.id)
    if (existing) {
      let dirty = false
      // Backfill role on profiles that predate the teacher feature.
      if (!existing.role) {
        existing.role = seed.role ?? 'student'
        dirty = true
      }
      // Migrate legacy single `assignment` to `assignments` queue.
      if (existing.assignment && !existing.assignments) {
        existing.assignments = [{ id: newAssignmentId(), ...existing.assignment }]
        delete existing.assignment
        dirty = true
      }
      // Backfill packages list for profiles that predate the shop feature.
      if (!Array.isArray(existing.packages)) {
        existing.packages = []
        dirty = true
      }
      if (dirty) writeProfile(existing)
      continue
    }
    const profile = {
      ...PROFILE_DEFAULTS,
      ...seed,
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

function newAssignmentId() {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function newPackageId() {
  return `pkg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function buyPackage(profileId, type) {
  const spec = SHOP_PACKAGES[type]
  if (!spec) return { ok: false, error: 'Unknown package' }
  const target = readProfile(profileId)
  if (!target) return { ok: false, error: 'Profile not found' }
  if (target.role === 'teacher') return { ok: false, error: 'Teachers cannot buy packages' }
  const balance = target.points ?? 0
  if (balance < spec.cost) return { ok: false, error: 'Not enough stars' }
  const pkg = {
    id: newPackageId(),
    type: spec.type,
    label: spec.label,
    minutes: spec.minutes,
    cost: spec.cost,
    emoji: spec.emoji,
    createdAt: new Date().toISOString(),
    status: 'active',
    usedAt: null,
  }
  const next = {
    ...target,
    points: balance - spec.cost,
    packages: [...(target.packages ?? []), pkg],
  }
  writeProfile(next)
  return { ok: true, profile: next, package: pkg }
}

export function setPackageStatus(profileId, packageId, status) {
  if (status !== 'active' && status !== 'used') return null
  const target = readProfile(profileId)
  if (!target) return null
  const packages = (target.packages ?? []).map((p) =>
    p.id === packageId
      ? { ...p, status, usedAt: status === 'used' ? new Date().toISOString() : null }
      : p
  )
  const next = { ...target, packages }
  writeProfile(next)
  return next
}

/** For the teacher view — returns [{ student, packages }] for every non-teacher profile. */
export function getAllStudentPackages() {
  return getAllProfiles()
    .filter((p) => p.role !== 'teacher')
    .map((student) => ({ student, packages: student.packages ?? [] }))
}

export function isTeacher(profile) {
  return profile?.role === 'teacher'
}

export function getAssignableStudents(excludeId) {
  return getAllProfiles().filter((p) => p.role !== 'teacher' && p.id !== excludeId)
}

export function addAssignmentToProfile(studentId, assignment) {
  const target = readProfile(studentId)
  if (!target) return null
  const withId = { id: newAssignmentId(), ...assignment }
  const next = { ...target, assignments: [...(target.assignments ?? []), withId] }
  writeProfile(next)
  return next
}

/** Pop the first (oldest) assignment from the active profile's queue. */
export function consumeActiveAssignment() {
  const current = getActiveProfile()
  if (!current) return null
  const queue = current.assignments ?? []
  if (queue.length === 0) return current
  const next = { ...current, assignments: queue.slice(1) }
  writeProfile(next)
  return next
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

export function saveActiveQuiz(activeQuiz) {
  const current = getActiveProfile()
  if (!current) return null
  const next = { ...current, activeQuiz }
  writeProfile(next)
  return next
}

export function clearActiveQuiz() {
  const current = getActiveProfile()
  if (!current) return null
  const { activeQuiz: _drop, ...rest } = current
  writeProfile(rest)
  return rest
}

export function adjustActivePoints(delta) {
  const current = getActiveProfile()
  if (!current) return null
  const next = { ...current, points: Math.max(0, (current.points ?? 0) + delta) }
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
