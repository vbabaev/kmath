import { apiGet, apiPost, apiPut } from './api'

// --- Constants & pure helpers ---

export const SHOP_PACKAGES = {
  '15min': { type: '15min', label: '15 iPad minutes', minutes: 15, cost: 300,  emoji: '📱' },
  '60min': { type: '60min', label: '60 iPad minutes', minutes: 60, cost: 1100, emoji: '⏰' },
}

const COLORS = {
  indigo:  { text: 'text-indigo-600',  bgLight: 'bg-indigo-50',  border: 'border-indigo-200',  pill: 'bg-indigo-100 text-indigo-700',  swatch: 'bg-indigo-400' },
  pink:    { text: 'text-pink-600',    bgLight: 'bg-pink-50',    border: 'border-pink-200',    pill: 'bg-pink-100 text-pink-700',      swatch: 'bg-pink-400' },
  emerald: { text: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-700',swatch: 'bg-emerald-400' },
  amber:   { text: 'text-amber-600',   bgLight: 'bg-amber-50',   border: 'border-amber-200',   pill: 'bg-amber-100 text-amber-700',    swatch: 'bg-amber-400' },
  violet:  { text: 'text-violet-600',  bgLight: 'bg-violet-50',  border: 'border-violet-200',  pill: 'bg-violet-100 text-violet-700',  swatch: 'bg-violet-400' },
  rose:    { text: 'text-rose-600',    bgLight: 'bg-rose-50',    border: 'border-rose-200',    pill: 'bg-rose-100 text-rose-700',      swatch: 'bg-rose-400' },
}

export const COLOR_CHOICES = Object.keys(COLORS)
export const EMOJI_CHOICES = ['👨', '👩', '👧', '👦', '🧑', '🧒', '🦊', '🐼', '🦁', '🐯', '🐸', '🦄']

export function getProfileColors(color) {
  return COLORS[color] ?? COLORS.indigo
}

export function isOwner(profile) {
  return profile?.role === 'owner'
}

export function isAdult(profile) {
  return profile?.role === 'owner' || profile?.role === 'parent'
}

export function isChild(profile) {
  return profile?.role === 'child'
}

export function localDateYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function newAssignmentId() {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function newPackageId() {
  return `pkg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// --- Reads ---

export async function getAllProfiles() {
  return apiGet('/profiles')
}

export async function getProfileById(id) {
  return apiGet(`/profiles/${id}`)
}

// --- Mutations ---
// Caller passes the current full profile (from App's `allProfiles` state) and
// gets back the updated profile from the server. App is responsible for
// splicing the response into its `allProfiles` state.

function profileToBody(p) {
  const body = {
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    settings: p.settings ?? { group: 'school' },
    points: p.points ?? 0,
    sessions: p.sessions ?? [],
    packages: p.packages ?? [],
    assignments: p.assignments ?? [],
    activeQuiz: p.activeQuiz ?? null,
  }
  // Only forward googleEmail if it's defined on the source profile.
  // Backend ignores it from non-teacher callers anyway.
  if ('googleEmail' in p) body.googleEmail = p.googleEmail ?? null
  // Only forward lastResult when explicitly set on the source profile —
  // otherwise legacy callers would clobber the server's "pending Results
  // screen" state.
  if ('lastResult' in p) body.lastResult = p.lastResult ?? null
  return body
}

export async function saveProfile(profile, options) {
  return apiPut(`/profiles/${profile.id}`, profileToBody(profile), options)
}

export async function createProfile({ name, emoji, color, role, googleEmail }) {
  return apiPost('/profiles', {
    name,
    emoji,
    color,
    role,
    googleEmail: googleEmail ?? null,
  })
}

// Teacher-only: change googleEmail on a profile. Backend silently ignores
// the field for non-teacher requesters.
export async function setProfileEmail(profile, googleEmail) {
  return saveProfile({ ...profile, googleEmail: googleEmail ?? null })
}

export async function buyPackage(profile, type) {
  const spec = SHOP_PACKAGES[type]
  if (!spec) return { ok: false, error: 'Unknown package' }
  if (isAdult(profile)) return { ok: false, error: 'Only children can buy packages' }
  const balance = profile.points ?? 0
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
  try {
    const updated = await saveProfile({
      ...profile,
      points: balance - spec.cost,
      packages: [...(profile.packages ?? []), pkg],
    })
    return { ok: true, profile: updated, package: pkg }
  } catch (err) {
    return { ok: false, error: err.message ?? 'Save failed' }
  }
}

export async function setPackageStatus(profile, packageId, status) {
  if (status !== 'active' && status !== 'used') return null
  const packages = (profile.packages ?? []).map((p) =>
    p.id === packageId
      ? { ...p, status, usedAt: status === 'used' ? new Date().toISOString() : null }
      : p,
  )
  return saveProfile({ ...profile, packages })
}

export async function addAssignment(student, assignment) {
  const withId = { id: newAssignmentId(), ...assignment }
  return saveProfile({
    ...student,
    assignments: [...(student.assignments ?? []), withId],
  })
}

export async function popFirstAssignment(profile) {
  const queue = profile.assignments ?? []
  if (queue.length === 0) return profile
  return saveProfile({ ...profile, assignments: queue.slice(1) })
}

// Serialize a live { module, problem, attempts, timeMs } row to the
// storage shape used by `session.problems` and `lastResult.completedProblems`.
function serializeProblem(c) {
  return {
    moduleId: c.module.id,
    problem: c.problem,
    attempts: c.attempts,
    timeMs: c.timeMs,
  }
}

function buildSessionEntry(result, profile, extras = {}) {
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
  const group = result.completedProblems[0]?.module.group ?? profile.settings?.group ?? 'school'
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
    // Per-problem replay data. The History detail page hydrates these
    // back into `{ module, problem, attempts, timeMs }` via `getModule()`.
    problems: result.completedProblems.map(serializeProblem),
  }
  if (extras.isAssignment) entry.isAssignment = true
  if (extras.moodStart) entry.moodStart = extras.moodStart
  if (extras.moodEnd) entry.moodEnd = extras.moodEnd
  return entry
}

// `extras` carries the assignment flag and the two mood values captured
// around the quiz (see `App.jsx` mood-start / mood-end screens). Quick
// Quiz / Custom Mix calls pass `{}` and the session entry simply omits
// the new fields.
export async function logSession(profile, result, extras = {}) {
  const entry = buildSessionEntry(result, profile, extras)
  // lastResult mirrors what the Results screen needs to render. Stored
  // alongside activeQuiz=null so sibling tabs/devices see the same screen.
  const lastResult = {
    score: result.score,
    totalAttempts: result.totalAttempts,
    initialCount: result.initialCount,
    completedProblems: result.completedProblems.map(serializeProblem),
  }
  return saveProfile({
    ...profile,
    activeQuiz: null,
    lastResult,
    points: (profile.points ?? 0) + (entry.score ?? 0),
    sessions: [...(profile.sessions ?? []), entry],
  })
}
