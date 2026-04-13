import { useRef } from 'react'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

// Only denominators that divide 100 cleanly (so fractions convert to whole-number percentages)
const VALID_DENS = [2, 4, 5, 10, 20, 25, 50]

function generate() {
  const den = VALID_DENS[rand(0, VALID_DENS.length - 1)]
  const num = rand(1, den - 1)
  const pct = (num * 100) / den
  const g = gcd(num, den)
  const simplNum = num / g
  const simplDen = den / g
  const direction = Math.random() < 0.5 ? 'toPercent' : 'toFraction'
  return { num, den, pct, simplNum, simplDen, direction }
}

function Frac({ num, den }) {
  return (
    <span className="inline-flex flex-col items-center leading-none gap-0.5">
      <span>{num}</span>
      <span className="border-t-2 border-gray-700 w-full" />
      <span>{den}</span>
    </span>
  )
}

function View({ problem }) {
  const { direction, num, den, pct } = problem
  return (
    <div className="flex items-center justify-center gap-4 text-3xl font-bold text-gray-800">
      {direction === 'toPercent' ? (
        <>
          <Frac num={num} den={den} />
          <span>=</span>
          <span className="text-gray-400">? %</span>
        </>
      ) : (
        <>
          <span>{pct}%</span>
          <span>=</span>
          <span className="text-gray-400">?</span>
        </>
      )}
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled, problem }) {
  const numRef = useRef(null)
  const denRef = useRef(null)

  if (problem.direction === 'toPercent') {
    return (
      <div className="flex justify-center items-center gap-2 mb-4">
        <input
          type="number"
          value={value.pct}
          onChange={(e) => onChange({ ...value, pct: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          disabled={disabled}
          autoFocus
          placeholder="?"
          className="w-28 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-purple-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-2xl font-bold text-gray-600">%</span>
      </div>
    )
  }

  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex flex-col items-center gap-1">
        <input
          ref={numRef}
          type="number"
          value={value.num}
          onChange={(e) => onChange({ ...value, num: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
            if (e.key === '/' || e.key === 'ArrowDown') { e.preventDefault(); denRef.current?.focus() }
          }}
          disabled={disabled}
          autoFocus
          placeholder="?"
          className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-purple-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="w-20 border-t-2 border-gray-400" />
        <input
          ref={denRef}
          type="number"
          value={value.den}
          onChange={(e) => onChange({ ...value, den: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
            if (e.key === 'ArrowUp') { e.preventDefault(); numRef.current?.focus() }
          }}
          disabled={disabled}
          placeholder="?"
          className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-purple-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}

function isComplete(value, problem) {
  if (problem.direction === 'toPercent') return value.pct.trim() !== ''
  return value.num.trim() !== '' && value.den.trim() !== ''
}

function check(problem, value) {
  if (problem.direction === 'toPercent') {
    const entered = parseInt(value.pct, 10)
    return !isNaN(entered) && entered === problem.pct
  }

  const n = parseInt(value.num, 10)
  const d = parseInt(value.den, 10)
  if (isNaN(n) || isNaN(d) || d === 0) return false
  return n * 100 === problem.pct * d
}

function key(problem) {
  if (problem.direction === 'toPercent') return `pct:toPercent:${problem.num}/${problem.den}`
  return `pct:toFraction:${problem.pct}`
}

function displayAnswer(problem) {
  if (problem.direction === 'toPercent') return `${problem.pct}%`
  return `${problem.simplNum}/${problem.simplDen}  (or any equivalent fraction)`
}

export default {
  id: 'percent',
  label: 'Percentages',
  emoji: '💯',
  color: 'from-purple-400 to-purple-600',
  bgLight: 'bg-purple-50',
  border: 'border-purple-200',
  description: 'Convert fractions ↔ percentages',
  defaultInput: { pct: '', num: '', den: '' },
  defaultCount: 10,
  generate,
  View,
  Input,
  isComplete,
  check,
  key,
  displayAnswer,
}
