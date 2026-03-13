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
  const raw = simplify(n1 + n2, denom)
  // answer as string "num/den" or whole number
  const answer = raw.den === 1 ? `${raw.num}` : `${raw.num}/${raw.den}`
  return { n1, n2, denom, answer }
}

function View({ problem }) {
  return (
    <div className="flex items-center justify-center gap-4 text-3xl font-bold text-gray-800">
      <Fraction num={problem.n1} den={problem.denom} />
      <span className="text-orange-400">+</span>
      <Fraction num={problem.n2} den={problem.denom} />
      <span>=</span>
      <span className="text-gray-400">?</span>
    </div>
  )
}

function Fraction({ num, den }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span>{num}</span>
      <span className="border-t-2 border-gray-700 w-full" />
      <span>{den}</span>
    </span>
  )
}

function normalizeInput(input) {
  return input.trim().replace(/\s+/g, '')
}

function check(problem, input) {
  return normalizeInput(input) === normalizeInput(problem.answer)
}

export default {
  id: 'fractions',
  label: 'Fractions',
  emoji: '🍕',
  color: 'from-orange-400 to-orange-600',
  bgLight: 'bg-orange-50',
  border: 'border-orange-200',
  description: 'Add fractions with the same denominator',
  inputHint: 'Enter as "a/b" or whole number…',
  generate,
  View,
  check,
}
