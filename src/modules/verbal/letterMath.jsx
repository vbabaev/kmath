const LETTERS = ['A', 'B', 'C', 'D', 'E']

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Equation generators ─────────────────────────────────────────────────────
// Each returns { values, ops, result } — operand values and operators.
// Constraints enforced by callers (genEquation):
//  - operand values are pairwise distinct
//  - no operand value equals the result (so the answer letter is unique)
//  - result is in [1, 100]

function tryGenTwo() {
  const op = pick(['+', '-', '*', '/'])
  if (op === '+') {
    const result = rand(3, 100)
    const a = rand(1, result - 1)
    return { values: [a, result - a], ops: ['+'], result }
  }
  if (op === '-') {
    const a = rand(3, 100)
    const b = rand(1, a - 1)
    return { values: [a, b], ops: ['-'], result: a - b }
  }
  if (op === '*') {
    const a = rand(2, 10)
    const b = rand(2, 10)
    return { values: [a, b], ops: ['*'], result: a * b }
  }
  // '/'
  const b = rand(2, 10)
  const result = rand(2, Math.floor(100 / b))
  const a = result * b
  return { values: [a, b], ops: ['/'], result }
}

function tryGenThree() {
  const pattern = pick([
    'a+b+c', 'a+b-c', 'a-b+c', 'a-b-c',
    'a+b*c', 'a-b*c', 'a*b+c', 'a*b-c',
    'a+b/c', 'a-b/c', 'a/b+c', 'a/b-c',
    'a*b*c', 'a*b/c', 'a/b*c',
  ])
  let a, b, c, result, ops
  switch (pattern) {
    case 'a+b+c': {
      a = rand(1, 96); b = rand(1, 99 - a); c = rand(1, 100 - a - b)
      result = a + b + c; ops = ['+', '+']; break
    }
    case 'a+b-c': {
      a = rand(1, 99); b = rand(1, 100 - a); c = rand(1, a + b - 1)
      result = a + b - c; ops = ['+', '-']; break
    }
    case 'a-b+c': {
      a = rand(2, 99); b = rand(1, a - 1); c = rand(1, 100 - (a - b))
      result = a - b + c; ops = ['-', '+']; break
    }
    case 'a-b-c': {
      a = rand(3, 100); b = rand(1, a - 2); c = rand(1, a - b - 1)
      result = a - b - c; ops = ['-', '-']; break
    }
    case 'a+b*c': {
      b = rand(2, 10); c = rand(2, 10)
      const m = b * c
      if (m >= 100) return null
      a = rand(1, 100 - m); result = a + m; ops = ['+', '*']; break
    }
    case 'a-b*c': {
      b = rand(2, 10); c = rand(2, 10)
      const m = b * c
      if (m >= 99) return null
      a = rand(m + 1, 100); result = a - m; ops = ['-', '*']; break
    }
    case 'a*b+c': {
      a = rand(2, 10); b = rand(2, 10)
      const m = a * b
      if (m >= 100) return null
      c = rand(1, 100 - m); result = m + c; ops = ['*', '+']; break
    }
    case 'a*b-c': {
      a = rand(2, 10); b = rand(2, 10)
      const m = a * b
      if (m <= 1) return null
      c = rand(1, m - 1); result = m - c; ops = ['*', '-']; break
    }
    case 'a+b/c': {
      c = rand(2, 10)
      const q = rand(2, 10)
      b = q * c
      if (b > 100) return null
      a = rand(1, 100 - q); result = a + q; ops = ['+', '/']; break
    }
    case 'a-b/c': {
      c = rand(2, 10)
      const q = rand(2, 10)
      b = q * c
      if (b > 100) return null
      a = rand(q + 1, 100); result = a - q; ops = ['-', '/']; break
    }
    case 'a/b+c': {
      b = rand(2, 10)
      const q = rand(2, 10)
      a = q * b
      if (a > 100) return null
      c = rand(1, 100 - q); result = q + c; ops = ['/', '+']; break
    }
    case 'a/b-c': {
      b = rand(2, 10)
      const q = rand(3, 10)
      a = q * b
      if (a > 100) return null
      c = rand(1, q - 1); result = q - c; ops = ['/', '-']; break
    }
    case 'a*b*c': {
      a = rand(2, 10); b = rand(2, 10); c = rand(2, 10)
      const m = a * b * c
      if (m > 100) return null
      result = m; ops = ['*', '*']; break
    }
    case 'a*b/c': {
      a = rand(2, 10); b = rand(2, 10); c = rand(2, 10)
      const m = a * b
      if (m % c !== 0) return null
      const q = m / c
      if (q < 1 || q > 100) return null
      result = q; ops = ['*', '/']; break
    }
    case 'a/b*c': {
      b = rand(2, 10)
      const q = rand(2, 10)
      a = q * b
      if (a > 100) return null
      c = rand(2, 10)
      result = q * c
      if (result > 100) return null
      ops = ['/', '*']; break
    }
    default: return null
  }
  if (a < 1 || a > 100 || b < 1 || b > 100 || c < 1 || c > 100) return null
  if (result < 1 || result > 100) return null
  return { values: [a, b, c], ops, result }
}

function genEquation() {
  for (let i = 0; i < 200; i++) {
    const useThree = Math.random() < 0.6
    const r = useThree ? tryGenThree() : tryGenTwo()
    if (!r) continue
    if (new Set(r.values).size !== r.values.length) continue
    if (r.values.includes(r.result)) continue
    return r
  }
  // Fallback: a simple two-operand problem that always succeeds.
  while (true) {
    const r = tryGenTwo()
    if (new Set(r.values).size !== r.values.length) continue
    if (r.values.includes(r.result)) continue
    return r
  }
}

function buildExpr(operandLetters, ops) {
  const sym = (op) => (op === '*' ? '×' : op === '/' ? '÷' : op)
  let s = operandLetters[0]
  for (let i = 0; i < ops.length; i++) {
    s += ` ${sym(ops[i])} ${operandLetters[i + 1]}`
  }
  return s
}

function generate() {
  const eq = genEquation()
  const numVars = eq.values.length

  const order = shuffle([...LETTERS])
  const operandLetters = order.slice(0, numVars)
  const answerLetter = order[numVars]
  const fillerLetters = order.slice(numVars + 1)

  const used = new Set([...eq.values, eq.result])
  const letterValues = {}
  operandLetters.forEach((L, i) => { letterValues[L] = eq.values[i] })
  letterValues[answerLetter] = eq.result

  for (const L of fillerLetters) {
    let v
    let attempts = 0
    do {
      v = rand(1, 100)
      attempts++
    } while (used.has(v) && attempts < 200)
    if (used.has(v)) {
      for (let k = 1; k <= 100; k++) {
        if (!used.has(k)) { v = k; break }
      }
    }
    used.add(v)
    letterValues[L] = v
  }

  return {
    letters: letterValues,
    expr: buildExpr(operandLetters, eq.ops),
    operandLetters,
    ops: eq.ops,
    answer: answerLetter,
  }
}

function LetterCard({ letter, value, tone = 'default' }) {
  const styles =
    tone === 'answer'
      ? 'bg-green-100 border-green-400'
      : tone === 'dim'
      ? 'bg-gray-50 border-gray-200 opacity-60'
      : 'bg-amber-50 border-amber-200'
  const labelStyle =
    tone === 'answer'
      ? 'text-green-700'
      : tone === 'dim'
      ? 'text-gray-400'
      : 'text-amber-600'
  const valueStyle =
    tone === 'answer'
      ? 'text-green-900'
      : tone === 'dim'
      ? 'text-gray-500'
      : 'text-amber-900'
  return (
    <div className={`rounded-xl border-2 py-2 ${styles}`}>
      <div className={`text-xs font-semibold uppercase ${labelStyle}`}>{letter}</div>
      <div className={`text-2xl md:text-3xl font-bold font-mono ${valueStyle}`}>{value}</div>
    </div>
  )
}

function View({ problem }) {
  const { letters, expr } = problem
  return (
    <div className="py-2">
      <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-6 max-w-md mx-auto">
        {LETTERS.map((L) => (
          <LetterCard key={L} letter={L} value={letters[L]} />
        ))}
      </div>
      <div className="text-3xl md:text-4xl font-bold tracking-wider font-mono text-gray-800">
        {expr} = <span className="text-amber-600">?</span>
      </div>
      <p className="mt-3 text-sm text-gray-500">
        Pick the letter whose value equals the answer.
      </p>
    </div>
  )
}

function CorrectView({ problem }) {
  const { letters, expr, answer } = problem
  const result = letters[answer]
  return (
    <div className="py-2">
      <div className="grid grid-cols-5 gap-1.5 md:gap-2 mb-6 max-w-md mx-auto">
        {LETTERS.map((L) => (
          <LetterCard
            key={L}
            letter={L}
            value={letters[L]}
            tone={L === answer ? 'answer' : 'dim'}
          />
        ))}
      </div>
      <div className="text-3xl md:text-4xl font-bold tracking-wider font-mono text-gray-800">
        {expr} = <span className="text-green-600">{result}</span>
      </div>
      <div className="text-xl text-gray-300 mt-3">↓</div>
      <div className="mt-2 inline-block px-6 py-3 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-3xl animate-[bounce_0.7s_ease-out]">
        {answer}
      </div>
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled }) {
  function handle(L) {
    if (disabled) return
    onChange(L)
    onSubmit(L)
  }
  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      {LETTERS.map((L) => (
        <button
          key={L}
          onClick={() => handle(L)}
          disabled={disabled}
          className={`py-3 rounded-2xl text-xl font-bold border-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-default ${
            value === L
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-white border-gray-200 text-gray-800 hover:border-amber-300 hover:bg-amber-50'
          }`}
        >
          {L}
        </button>
      ))}
    </div>
  )
}

function check(problem, value) {
  return value === problem.answer
}

function isComplete(value) {
  return typeof value === 'string' && LETTERS.includes(value)
}

function key(problem) {
  const lv = LETTERS.map((L) => `${L}=${problem.letters[L]}`).join(',')
  return `lm:${lv}:${problem.expr}`
}

function displayAnswer(problem) {
  return `${problem.answer} (${problem.letters[problem.answer]})`
}

export default {
  id: 'letterMath',
  label: 'Letter Math',
  emoji: '🔠',
  color: 'from-amber-400 to-orange-500',
  bgLight: 'bg-amber-50',
  border: 'border-amber-200',
  description: 'Letters stand for numbers — solve the equation, pick the letter',
  defaultInput: null,
  defaultCount: 10,
  group: 'verbal',
  generate,
  View,
  CorrectView,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
