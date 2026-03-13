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

// Exact rational value of the answer as { num, den } in lowest terms
function exactAnswer(problem) {
  return { num: problem.answerNum, den: problem.answerDen }
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

const FORMATS = [
  { id: 'whole',    label: 'Whole number' },
  { id: 'fraction', label: 'Fraction' },
  { id: 'mixed',    label: 'Mixed number' },
]

function StackedFrac({ numVal, denVal, onNumChange, onDenChange, onNumKey, onDenKey, numRef, denRef, disabled }) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <input
        ref={numRef}
        type="number"
        value={numVal}
        onChange={(e) => onNumChange(e.target.value)}
        onKeyDown={onNumKey}
        disabled={disabled}
        className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-indigo-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="w-20 border-t-2 border-gray-400" />
      <input
        ref={denRef}
        type="number"
        value={denVal}
        onChange={(e) => onDenChange(e.target.value)}
        onKeyDown={onDenKey}
        disabled={disabled}
        className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-indigo-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled }) {
  const wholeRef = useRef(null)
  const numRef = useRef(null)
  const denRef = useRef(null)

  function setFormat(fmt) {
    onChange({ ...value, format: fmt, whole: '', num: '', den: '' })
    // focus the first field after state update
    setTimeout(() => {
      if (fmt === 'whole') wholeRef.current?.focus()
      else numRef.current?.focus()
    }, 0)
  }

  return (
    <div className="mb-4">
      {/* Format picker */}
      <div className="flex gap-2 justify-center mb-5">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-colors cursor-pointer disabled:opacity-50 ${
              value.format === f.id
                ? 'bg-orange-400 border-orange-400 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Inputs for selected format */}
      <div className="flex justify-center items-center gap-3 min-h-[96px]">
        {value.format === 'whole' && (
          <input
            ref={wholeRef}
            type="number"
            value={value.whole}
            onChange={(e) => onChange({ ...value, whole: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            disabled={disabled}
            className="w-28 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-indigo-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        )}

        {value.format === 'fraction' && (
          <StackedFrac
            numVal={value.num} denVal={value.den}
            onNumChange={(v) => onChange({ ...value, num: v })}
            onDenChange={(v) => onChange({ ...value, den: v })}
            onNumKey={(e) => {
              if (e.key === 'Enter') onSubmit()
              if (e.key === '/' || e.key === 'ArrowDown') { e.preventDefault(); denRef.current?.focus() }
            }}
            onDenKey={(e) => {
              if (e.key === 'Enter') onSubmit()
              if (e.key === 'ArrowUp') { e.preventDefault(); numRef.current?.focus() }
            }}
            numRef={numRef} denRef={denRef}
            disabled={disabled}
          />
        )}

        {value.format === 'mixed' && (
          <>
            <input
              ref={wholeRef}
              type="number"
              value={value.whole}
              onChange={(e) => onChange({ ...value, whole: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit()
                if (e.key === 'ArrowRight') { e.preventDefault(); numRef.current?.focus() }
              }}
              disabled={disabled}
              className="w-20 border-2 border-gray-200 rounded-xl px-2 py-3 text-2xl text-center focus:outline-none focus:border-indigo-400 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <StackedFrac
              numVal={value.num} denVal={value.den}
              onNumChange={(v) => onChange({ ...value, num: v })}
              onDenChange={(v) => onChange({ ...value, den: v })}
              onNumKey={(e) => {
                if (e.key === 'Enter') onSubmit()
                if (e.key === '/' || e.key === 'ArrowDown') { e.preventDefault(); denRef.current?.focus() }
                if (e.key === 'ArrowLeft') { e.preventDefault(); wholeRef.current?.focus() }
              }}
              onDenKey={(e) => {
                if (e.key === 'Enter') onSubmit()
                if (e.key === 'ArrowUp') { e.preventDefault(); numRef.current?.focus() }
              }}
              numRef={numRef} denRef={denRef}
              disabled={disabled}
            />
          </>
        )}

        {!value.format && (
          <p className="text-gray-400 text-sm">Choose a format above</p>
        )}
      </div>
    </div>
  )
}

function check(problem, value) {
  const { answerNum, answerDen } = problem
  const { format, whole, num, den } = value

  if (format === 'whole') {
    const w = parseInt(whole, 10)
    if (isNaN(w)) return false
    // w === answerNum / answerDen  →  w * answerDen === answerNum
    return w * answerDen === answerNum
  }

  if (format === 'fraction') {
    const n = parseInt(num, 10)
    const d = parseInt(den, 10)
    if (isNaN(n) || isNaN(d) || d === 0) return false
    // n/d === answerNum/answerDen  →  cross-multiply
    return n * answerDen === answerNum * d
  }

  if (format === 'mixed') {
    const w = parseInt(whole, 10) || 0
    const n = parseInt(num, 10)
    const d = parseInt(den, 10)
    if (isNaN(n) || isNaN(d) || d === 0) return false
    // w + n/d === answerNum/answerDen  →  (w*d + n) * answerDen === answerNum * d
    return (w * d + n) * answerDen === answerNum * d
  }

  return false
}

function isComplete(value) {
  if (!value.format) return false
  if (value.format === 'whole') return value.whole.trim() !== ''
  if (value.format === 'fraction') return value.num.trim() !== '' && value.den.trim() !== ''
  if (value.format === 'mixed') return value.whole.trim() !== '' && value.num.trim() !== '' && value.den.trim() !== ''
  return false
}

function key(problem) {
  return `${problem.n1}/${problem.denom}+${problem.n2}/${problem.denom}`
}

function displayAnswer(problem) {
  const { answerNum, answerDen } = problem
  if (answerDen === 1) return String(answerNum)
  // if improper, also show mixed form
  if (answerNum > answerDen) {
    const whole = Math.floor(answerNum / answerDen)
    const rem = answerNum % answerDen
    return rem === 0 ? String(whole) : `${answerNum}/${answerDen}  or  ${whole} ${rem}/${answerDen}`
  }
  return `${answerNum}/${answerDen}`
}

export default {
  id: 'fractions',
  label: 'Fractions',
  emoji: '🍕',
  color: 'from-orange-400 to-orange-600',
  bgLight: 'bg-orange-50',
  border: 'border-orange-200',
  description: 'Add fractions with the same denominator',
  defaultInput: { format: null, whole: '', num: '', den: '' },
  generate,
  View,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
