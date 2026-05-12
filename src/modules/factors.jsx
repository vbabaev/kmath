// "Find all factors of N" — multi-select module.
//
// FACTOR_DATA is the map the user asked for: one entry per number 15..150,
// each carrying { factors, decoys }. Factors are computed by trial division;
// decoys are 4 numbers in [2, n-1] that are NOT factors, picked deterministically
// via an LCG seeded on n so the per-number data is stable across reloads.

const MIN_N = 15
const MAX_N = 150
const NUM_DECOYS = 4
const FREEBIE = 1

// Proper divisors of n: every k in [1, n) that divides n. n itself is
// excluded — the kid doesn't have to "remember" that every number divides
// itself, and we don't want n appearing in the option grid.
function divisors(n) {
  const out = []
  for (let i = 1; i < n; i++) {
    if (n % i === 0) out.push(i)
  }
  return out
}

function lcg(seed) {
  let state = (seed >>> 0) || 1
  return () => {
    state = ((state * 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function pickDecoys(n, factorSet) {
  const pool = []
  for (let i = 2; i < n; i++) {
    if (!factorSet.has(i)) pool.push(i)
  }
  const rand = lcg(n)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, NUM_DECOYS).sort((a, b) => a - b)
}

const FACTOR_DATA = (() => {
  const data = {}
  for (let n = MIN_N; n <= MAX_N; n++) {
    const factors = divisors(n)
    data[n] = { factors, decoys: pickDecoys(n, new Set(factors)) }
  }
  return data
})()

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generate() {
  const n = Math.floor(Math.random() * (MAX_N - MIN_N + 1)) + MIN_N
  const { factors, decoys } = FACTOR_DATA[n]
  const options = shuffle([...factors, ...decoys])
  return { n, factors, decoys, options }
}

function View({ problem }) {
  return (
    <div className="text-center">
      <p className="text-lg text-gray-700 mb-2">Pick all the factors of</p>
      <p className="text-6xl font-bold text-cyan-600 tracking-wide">{problem.n}</p>
      <p className="text-xs text-gray-400 mt-3">1 is already selected for you</p>
    </div>
  )
}

function CorrectView({ problem }) {
  return (
    <div className="text-center">
      <p className="text-lg text-gray-700 mb-2">Factors of {problem.n}</p>
      <p className="text-2xl font-bold text-cyan-700 tracking-wide animate-[bounce_0.4s_ease-out]">
        {problem.factors.join(' · ')}
      </p>
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled, problem }) {
  const selected = new Set(value ?? [])

  function toggle(num) {
    if (disabled || num === FREEBIE) return
    const next = new Set(selected)
    if (next.has(num)) next.delete(num)
    else next.add(num)
    onChange([...next].sort((a, b) => a - b))
  }

  // Quiz keeps the Input mounted but disabled after submit. On a correct
  // submission we celebrate the selected factors in green; on a wrong
  // submission we deliberately reveal nothing — the kid sees the red View
  // card and tries again after the 900 ms reset.
  const showCorrect = disabled && check(problem, value)

  return (
    <div className="max-w-md mx-auto">
      <div className="grid grid-cols-4 gap-2 mb-4">
        {problem.options.map((opt) => {
          const isSelected = selected.has(opt)
          const isFreebie = opt === FREEBIE

          let cls = 'bg-white border-gray-200 text-gray-800 hover:border-cyan-300 hover:bg-cyan-50'
          if (isFreebie) {
            cls = 'bg-cyan-100 border-cyan-300 text-cyan-700 font-bold'
          } else if (showCorrect && isSelected) {
            cls = 'bg-green-100 border-green-400 text-green-800'
          } else if (isSelected) {
            cls = 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
          }

          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              disabled={disabled || isFreebie}
              className={`py-3 rounded-xl border-2 font-semibold text-lg cursor-pointer disabled:cursor-default transition-colors ${cls}`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onSubmit()}
        disabled={disabled}
        className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-cyan-600 hover:to-cyan-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
      >
        Check Answer
      </button>
    </div>
  )
}

function check(problem, input) {
  const sel = [...new Set(input ?? [])].sort((a, b) => a - b)
  const fac = [...problem.factors].sort((a, b) => a - b)
  if (sel.length !== fac.length) return false
  for (let i = 0; i < sel.length; i++) {
    if (sel[i] !== fac[i]) return false
  }
  return true
}

function isComplete() {
  return true
}

function key(problem) {
  return `factors:${problem.n}`
}

function displayAnswer(problem) {
  return problem.factors.join(', ')
}

export default {
  id: 'factors',
  label: 'Factors',
  emoji: '🧱',
  color: 'from-cyan-400 to-cyan-600',
  bgLight: 'bg-cyan-50',
  border: 'border-cyan-200',
  description: 'Pick every factor of the number',
  defaultInput: [FREEBIE],
  defaultCount: 10,
  group: 'school',
  generate,
  View,
  CorrectView,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
