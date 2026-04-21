function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const divisor = rand(2, 12)
  const quotient = rand(10, 99)
  return { dividend: divisor * quotient, divisor, answer: quotient }
}

function View({ problem }) {
  return (
    <p className="text-3xl font-bold text-gray-800 tracking-wide">
      {problem.dividend} <span className="text-green-500">÷</span> {problem.divisor} = ?
    </p>
  )
}

function check(problem, input) {
  return parseInt(input.trim(), 10) === problem.answer
}

function key(problem) {
  return `${problem.dividend}/${problem.divisor}`
}

function displayAnswer(problem) {
  return String(problem.answer)
}

export default {
  id: 'division',
  label: 'Division',
  emoji: '➗',
  color: 'from-green-400 to-green-600',
  bgLight: 'bg-green-50',
  border: 'border-green-200',
  description: 'Long division practice',
  inputHint: 'Enter the quotient…',
  group: 'school',
  defaultCount: 10,
  generate,
  View,
  check,
  key,
  displayAnswer,
}
