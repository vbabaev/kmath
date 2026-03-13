import { useRef } from 'react'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

function simplify(num, den) {
  const g = gcd(Math.abs(num), Math.abs(den))
  return { num: num / g, den: den / g }
}

function generate() {
  const denom = rand(2, 10)
  const n1 = rand(1, denom - 1)
  const n2 = rand(1, denom - 1)
  const s = simplify(n1 + n2, denom)
  return { n1, n2, denom, answerNum: s.num, answerDen: s.den }
}

function View({ problem }) {
  return (
    <div className="flex items-center justify-center gap-4 text-3xl font-bold text-gray-800">
      <Frac num={problem.n1} den={problem.denom} />
      <span className="text-orange-400">+</span>
      <Frac num={problem.n2} den={problem.denom} />
      <span>=</span>
      <span className="text-gray-400">?</span>
    </div>
  )
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

function Input({ value, onChange, onSubmit, disabled }) {
  const denRef = useRef(null)
  const numRef = useRef(null)

  function handleNumKey(e) {
    if (e.key === 'Enter') onSubmit()
    if (e.key === '/' || e.key === 'ArrowDown') { e.preventDefault(); denRef.current?.focus() }
  }

  function handleDenKey(e) {
    if (e.key === 'Enter') onSubmit()
    if (e.key === 'ArrowUp') { e.preventDefault(); numRef.current?.focus() }
  }

  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex flex-col items-center gap-1">
        <input
          ref={numRef}
          type="number"
          value={value.num}
          onChange={(e) => onChange({ ...value, num: e.target.value })}
          onKeyDown={handleNumKey}
          disabled={disabled}
          className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-indigo-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="w-20 border-t-2 border-gray-400" />
        <input
          ref={denRef}
          type="number"
          value={value.den}
          onChange={(e) => onChange({ ...value, den: e.target.value })}
          onKeyDown={handleDenKey}
          disabled={disabled}
          className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-indigo-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}

function check(problem, value) {
  const num = parseInt(value.num, 10)
  const den = parseInt(value.den, 10)
  if (isNaN(num) || isNaN(den) || den === 0) return false
  // cross-multiply to compare fractions without re-simplifying
  return num * problem.answerDen === problem.answerNum * den
}

function isComplete(value) {
  const num = value.num.toString().trim()
  // denominator optional when answer is a whole number — but require it explicitly
  const den = value.den.toString().trim()
  return num !== '' && den !== ''
}

export default {
  id: 'fractions',
  label: 'Fractions',
  emoji: '🍕',
  color: 'from-orange-400 to-orange-600',
  bgLight: 'bg-orange-50',
  border: 'border-orange-200',
  description: 'Add fractions with the same denominator',
  defaultInput: { num: '', den: '' },
  generate,
  View,
  Input,
  check,
  isComplete,
}
