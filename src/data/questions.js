function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

function generateMultiplication() {
  const a = rand(12, 99)
  const b = rand(12, 99)
  return {
    question: `${a} × ${b} = ?`,
    answer: a * b,
    type: 'number',
  }
}

function generateDivision() {
  const b = rand(2, 12)
  const answer = rand(10, 99)
  const a = b * answer
  return {
    question: `${a} ÷ ${b} = ?`,
    answer,
    type: 'number',
  }
}

function generateFractions() {
  const denom = rand(2, 10)
  const n1 = rand(1, denom - 1)
  const n2 = rand(1, denom - 1)
  const sumNum = n1 + n2
  const g = gcd(sumNum, denom)
  const simplNum = sumNum / g
  const simplDen = denom / g

  return {
    question: `${n1}/${denom} + ${n2}/${denom} = ?  (enter as "a/b" or whole number)`,
    answer: simplDen === 1 ? `${simplNum}` : `${simplNum}/${simplDen}`,
    type: 'fraction',
  }
}

function generateDecimals() {
  const a = parseFloat((rand(1, 99) / 10).toFixed(1))
  const b = parseFloat((rand(1, 99) / 10).toFixed(1))
  const ops = ['+', '-']
  const op = ops[rand(0, 1)]
  const result = op === '+' ? parseFloat((a + b).toFixed(1)) : parseFloat(Math.abs(a - b).toFixed(1))
  const [qa, qb] = op === '-' ? [Math.max(a, b), Math.min(a, b)] : [a, b]
  return {
    question: `${qa} ${op} ${qb} = ?`,
    answer: result,
    type: 'number',
  }
}

const generators = {
  multiplication: generateMultiplication,
  division: generateDivision,
  fractions: generateFractions,
  decimals: generateDecimals,
}

export function generateQuestion(topicId) {
  return generators[topicId]?.() ?? generateMultiplication()
}
