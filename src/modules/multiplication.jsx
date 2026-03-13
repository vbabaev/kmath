function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const a = rand(12, 99)
  const b = rand(12, 99)
  return { a, b, answer: a * b }
}

function View({ problem }) {
  return (
    <p className="text-3xl font-bold text-gray-800 tracking-wide">
      {problem.a} <span className="text-indigo-400">×</span> {problem.b} = ?
    </p>
  )
}

function check(problem, input) {
  return parseInt(input.trim(), 10) === problem.answer
}

function key(problem) {
  return `${problem.a}*${problem.b}`
}

function displayAnswer(problem) {
  return String(problem.answer)
}

export default {
  id: 'multiplication',
  label: 'Multiplication',
  emoji: '✖️',
  color: 'from-blue-400 to-blue-600',
  bgLight: 'bg-blue-50',
  border: 'border-blue-200',
  description: 'Multi-digit multiplication',
  inputHint: 'Enter the product…',
  generate,
  View,
  check,
  key,
  displayAnswer,
}
