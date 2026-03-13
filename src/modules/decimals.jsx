function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const a = rand(1, 99) / 10
  const b = rand(1, 99) / 10
  const ops = ['+', '-']
  const op = ops[rand(0, 1)]
  const [left, right] = op === '-'
    ? [Math.max(a, b), Math.min(a, b)]
    : [a, b]
  const answer = parseFloat((op === '+' ? left + right : left - right).toFixed(1))
  return { left: parseFloat(left.toFixed(1)), right: parseFloat(right.toFixed(1)), op, answer }
}

function View({ problem }) {
  return (
    <p className="text-3xl font-bold text-gray-800 tracking-wide">
      {problem.left}{' '}
      <span className="text-purple-400">{problem.op}</span>{' '}
      {problem.right} = ?
    </p>
  )
}

function check(problem, input) {
  return parseFloat(input.trim()) === problem.answer
}

export default {
  id: 'decimals',
  label: 'Decimals',
  emoji: '🔢',
  color: 'from-purple-400 to-purple-600',
  bgLight: 'bg-purple-50',
  border: 'border-purple-200',
  description: 'Add and subtract decimals',
  inputHint: 'Enter the decimal result…',
  generate,
  View,
  check,
}
