const DENOMINATORS = [2, 5, 10, 20, 50, 100]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFraction() {
  const den = DENOMINATORS[rand(0, DENOMINATORS.length - 1)]
  const num = rand(1, den - 1)
  return { num, den, value: num / den }
}

function fmtDecimal(val) {
  // Show up to 2 decimal places, strip trailing zeros
  return parseFloat(val.toFixed(2)).toString()
}

function generate() {
  const frac = randomFraction()
  const isEqual = Math.random() < 0.33

  let decimalValue
  if (isEqual) {
    decimalValue = frac.value
  } else {
    // Pick a different fraction's decimal value (same valid denominator set)
    let other
    let tries = 0
    do {
      other = randomFraction()
      tries++
    } while (Math.abs(other.value - frac.value) < 0.001 && tries < 100)
    decimalValue = other.value
  }

  const fracOnLeft = Math.random() < 0.5
  const leftVal = fracOnLeft ? frac.value : decimalValue
  const rightVal = fracOnLeft ? decimalValue : frac.value
  const answer = leftVal < rightVal ? '<' : leftVal > rightVal ? '>' : '='

  return {
    num: frac.num,
    den: frac.den,
    decimal: fmtDecimal(decimalValue),
    fracOnLeft,
    answer,
  }
}

function Frac({ num, den }) {
  return (
    <span className="inline-flex flex-col items-center leading-none gap-1">
      <span className="text-3xl font-bold">{num}</span>
      <span className="border-t-2 border-gray-700 w-full" />
      <span className="text-3xl font-bold">{den}</span>
    </span>
  )
}

function View({ problem }) {
  const { num, den, decimal, fracOnLeft } = problem
  const left = fracOnLeft ? <Frac num={num} den={den} /> : <span className="text-3xl font-bold">{decimal}</span>
  const right = fracOnLeft ? <span className="text-3xl font-bold">{decimal}</span> : <Frac num={num} den={den} />
  return (
    <div className="flex items-center justify-center gap-6 py-2 text-gray-800">
      {left}
      <span className="text-3xl font-bold text-gray-400">?</span>
      {right}
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled }) {
  function handleSelect(sym) {
    if (disabled) return
    onChange(sym)
    onSubmit(sym)
  }

  return (
    <div className="flex justify-center gap-4 mb-4">
      {['<', '=', '>'].map((sym) => (
        <button
          key={sym}
          onClick={() => handleSelect(sym)}
          disabled={disabled}
          className={`w-16 h-16 rounded-2xl text-2xl font-bold border-2 transition-all cursor-pointer active:scale-90 disabled:opacity-50 disabled:cursor-default ${
            value === sym
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          {sym}
        </button>
      ))}
    </div>
  )
}

function check(problem, value) {
  return value === problem.answer
}

function isComplete(value) {
  return value !== null && value !== ''
}

function key(problem) {
  return `cmp:${problem.num}/${problem.den}:${problem.decimal}:${problem.fracOnLeft}`
}

function displayAnswer(problem) {
  return problem.answer
}

export default {
  id: 'compare',
  label: 'Compare',
  emoji: '⚖️',
  color: 'from-rose-400 to-rose-600',
  bgLight: 'bg-rose-50',
  border: 'border-rose-200',
  description: 'Compare fractions and decimals',
  defaultInput: null,
  group: 'school',
  defaultCount: 10,
  generate,
  View,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
