import multiplication from './multiplication'
import division from './division'
import divisibility from './divisibility'
import factors from './factors'
import fractions from './fractions'
import decimals from './decimals'
import compare from './compare'
import rounding from './rounding'
import percent from './percent'
import complicatedPercent from './complicatedPercent'
import primeSquareCubic from './primeSquareCubic'
import roman from './roman'
import negativeNumbers from './negativeNumbers'
import perimeters from './perimeters'
import angles from './angles'
import square from './areas/square'
import rectangle from './areas/rectangle'
import rectangleCutout from './rectangleCutout'
import proportions from './word/proportions'
import statistics from './statistics'
import wordSplit from './verbal/wordSplit'
import wordGap from './verbal/wordGap'
import letterMath from './verbal/letterMath'
import letterCodes from './verbal/letterCodes'

export const MODULES = [
  multiplication,
  division,
  divisibility,
  factors,
  fractions,
  decimals,
  compare,
  rounding,
  percent,
  perimeters,
  angles,
  complicatedPercent,
  primeSquareCubic,
  roman,
  negativeNumbers,
  proportions,
  statistics,
  square,
  rectangle,
  rectangleCutout,
  wordSplit,
  wordGap,
  letterMath,
  letterCodes,
]

export const GROUPS = [
  { id: 'school', label: 'School Math', emoji: '🧮' },
  { id: 'extra', label: 'Extra Math', emoji: '➕' },
  { id: 'verbal', label: 'Verbal Reasoning', emoji: '📖' },
]

export const SUBGROUP_META = {
  areas: { id: 'areas', label: 'Areas', emoji: '📐' },
  word: { id: 'word', label: 'Word Problems', emoji: '📝' },
}

export function getModule(id) {
  return MODULES.find((m) => m.id === id)
}

export function getModulesByGroup(groupId) {
  return MODULES.filter((m) => m.group === groupId)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateProblems(counts) {
  const problems = []
  for (const mod of MODULES) {
    const n = counts[mod.id] ?? 0
    if (n === 0) continue
    const seen = new Set()
    let tries = 0
    while (problems.filter((p) => p.module === mod).length < n && tries < n * 20) {
      const problem = mod.generate()
      const k = mod.key(problem)
      if (!seen.has(k)) {
        seen.add(k)
        problems.push({ module: mod, problem })
      }
      tries++
    }
  }
  return shuffle(problems)
}

export function countsFromProblems(problems) {
  const counts = {}
  for (const { module } of problems) {
    counts[module.id] = (counts[module.id] ?? 0) + 1
  }
  return counts
}

// ─── Quiz persistence helpers ────────────────────────────────────────────────
// Problem objects carry a live module reference that can't be serialised, so
// on save we swap it for `moduleId` and on load we resolve it back.

export function toProblemRef({ module, problem, modifiers }) {
  const ref = { moduleId: module.id, problem }
  if (Array.isArray(modifiers) && modifiers.length > 0) ref.modifiers = modifiers
  return ref
}

export function fromProblemRef({ moduleId, problem, modifiers }) {
  const module = getModule(moduleId)
  if (!module) return null
  const out = { module, problem }
  if (Array.isArray(modifiers) && modifiers.length > 0) out.modifiers = modifiers
  return out
}
