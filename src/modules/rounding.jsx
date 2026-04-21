// Rounding module — round to nearest tenth or hundredth.
// All arithmetic is done in integer units to avoid float precision issues.
// "Close to half" (50%): deciding digit is 4 or 5 — the tricky boundary cases.

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const CLOSE_DIGITS = [4, 5]
const FAR_DIGITS   = [0, 1, 2, 3, 6, 7, 8, 9]

function generate() {
  const type        = Math.random() < 0.5 ? 'tenth' : 'hundredth'
  const closeToHalf = Math.random() < 0.5

  const whole    = rand(1, 20)
  const tenths   = rand(0, 9)

  if (type === 'tenth') {
    // Deciding digit is the hundredths place
    const hundredths = closeToHalf
      ? CLOSE_DIGITS[rand(0, 1)]
      : FAR_DIGITS[rand(0, FAR_DIGITS.length - 1)]

    const numStr = `${whole}.${tenths}${hundredths}`

    // Integer arithmetic: work in hundredths-units then round
    const inHundredths = whole * 100 + tenths * 10 + hundredths
    const roundedTenthsUnits = whole * 10 + tenths + (hundredths >= 5 ? 1 : 0)
    const answerWhole  = Math.floor(roundedTenthsUnits / 10)
    const answerTenths = roundedTenthsUnits % 10
    const answerDisplay = `${answerWhole}.${answerTenths}`
    const answer = roundedTenthsUnits / 10

    return { type, numStr, answer, answerDisplay, _key: `round:${numStr}:tenth` }

  } else {
    // Deciding digit is the thousandths place
    const hundredths  = rand(0, 9)
    const thousandths = closeToHalf
      ? CLOSE_DIGITS[rand(0, 1)]
      : FAR_DIGITS[rand(0, FAR_DIGITS.length - 1)]

    const numStr = `${whole}.${tenths}${hundredths}${thousandths}`

    // Integer arithmetic: work in thousandths-units then round
    const roundedHundredthsUnits = whole * 100 + tenths * 10 + hundredths + (thousandths >= 5 ? 1 : 0)
    const answerWhole      = Math.floor(roundedHundredthsUnits / 100)
    const rem              = roundedHundredthsUnits % 100
    const answerTenths     = Math.floor(rem / 10)
    const answerHundredths = rem % 10
    const answerDisplay = `${answerWhole}.${answerTenths}${answerHundredths}`
    const answer = roundedHundredthsUnits / 100

    return { type, numStr, answer, answerDisplay, _key: `round:${numStr}:hundredth` }
  }
}

function View({ problem }) {
  const place = problem.type === 'tenth' ? 'tenth' : 'hundredth'
  return (
    <div className="text-center space-y-3">
      <p className="text-5xl font-bold text-gray-800 tracking-tight">{problem.numStr}</p>
      <p className="text-gray-500 text-base">
        Round to the nearest <span className="font-semibold text-gray-700">{place}</span>
      </p>
    </div>
  )
}

function check(problem, input) {
  const val = parseFloat(input.trim())
  return !isNaN(val) && Math.abs(val - problem.answer) < 0.0001
}

function key(problem) { return problem._key }

function displayAnswer(problem) { return problem.answerDisplay }

export default {
  id: 'rounding',
  label: 'Rounding',
  emoji: '🎯',
  color: 'from-cyan-400 to-cyan-600',
  bgLight: 'bg-cyan-50',
  border: 'border-cyan-200',
  description: 'Round to the nearest tenth or hundredth',
  inputHint: 'Rounded value…',
  group: 'school',
  defaultCount: 10,
  generate,
  View,
  check,
  key,
  displayAnswer,
}
