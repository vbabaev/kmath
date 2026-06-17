// Negative numbers — add and subtract within ±50 operands, every
// shape: `-a + b`, `a - b`, `-a - b`, `a + (-b)`, `a - (-b)`,
// `-a + (-b)`, `-a - (-b)`. Result lands in ±100 worst case but
// usually smaller. Text input throughout (no MC). Tips include
// big colour-coded rule formulas plus a per-problem walkthrough.

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const TEMPLATES = [
  () => ({ left: -rand(1, 50), op: '+', right: rand(1, 50) }),    // -a + b
  () => ({ left: rand(1, 50), op: '-', right: rand(1, 50) }),     // a - b
  () => ({ left: -rand(1, 50), op: '-', right: rand(1, 50) }),    // -a - b
  () => ({ left: rand(1, 50), op: '+', right: -rand(1, 50) }),    // a + (-b)
  () => ({ left: rand(1, 50), op: '-', right: -rand(1, 50) }),    // a - (-b)
  () => ({ left: -rand(1, 50), op: '+', right: -rand(1, 50) }),   // -a + (-b)
  () => ({ left: -rand(1, 50), op: '-', right: -rand(1, 50) }),   // -a - (-b)
]

function evalProblem({ left, op, right }) {
  return op === '+' ? left + right : left - right
}

function generate() {
  const t = pick(TEMPLATES)()
  return {
    left: t.left,
    op: t.op,
    right: t.right,
    answer: evalProblem(t),
    _key: `neg:${t.left}:${t.op}:${t.right}`,
  }
}

// ─── Tips (rules + per-problem walkthrough) ─────────────────────────────────

function FormulaCard({ tone, example, label }) {
  const tones = {
    rose: {
      box: 'bg-rose-100 border-rose-300 text-rose-900',
      label: 'text-rose-700',
    },
    emerald: {
      box: 'bg-emerald-100 border-emerald-300 text-emerald-900',
      label: 'text-emerald-700',
    },
    sky: {
      box: 'bg-sky-100 border-sky-300 text-sky-900',
      label: 'text-sky-700',
    },
    violet: {
      box: 'bg-violet-100 border-violet-300 text-violet-900',
      label: 'text-violet-700',
    },
  }[tone]
  return (
    <div className={`rounded-xl border-2 px-3 py-2.5 ${tones.box}`}>
      <div className={`text-[10px] uppercase tracking-wide font-semibold ${tones.label}`}>
        {label}
      </div>
      <div className="mt-1 text-xl md:text-2xl font-mono font-bold tabular-nums">
        {example}
      </div>
    </div>
  )
}

const TIP_1 = {
  body: (
    <>
      Picture the number line:
      <div className="my-2 font-mono text-base md:text-lg text-center text-gray-700 dark:text-gray-300">
        … <span className="text-rose-600 font-bold">−3</span>{' '}
        <span className="text-rose-600 font-bold">−2</span>{' '}
        <span className="text-rose-600 font-bold">−1</span>{' '}
        <span className="text-gray-500">0</span>{' '}
        <span className="text-emerald-600 font-bold">1</span>{' '}
        <span className="text-emerald-600 font-bold">2</span>{' '}
        <span className="text-emerald-600 font-bold">3</span> …
      </div>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-0.5">
        <li>
          <b>Adding</b> moves you <b className="text-emerald-700">right</b>{' '}
          (toward bigger / more positive).
        </li>
        <li>
          <b>Subtracting</b> moves you <b className="text-rose-700">left</b>{' '}
          (toward smaller / more negative).
        </li>
      </ul>
    </>
  ),
}

const TIP_2 = {
  body: (
    <>
      The three rules that handle every case:
      <div className="mt-3 space-y-2">
        <FormulaCard
          tone="rose"
          label="Same signs — add and keep the sign"
          example={
            <>
              <span>−3 − 15 = −(3 + 15) = </span>
              <span className="text-rose-700">−18</span>
            </>
          }
        />
        <FormulaCard
          tone="sky"
          label="Different signs — subtract; bigger one wins the sign"
          example={
            <>
              <span>−10 + 3 = −(10 − 3) = </span>
              <span className="text-rose-700">−7</span>
            </>
          }
        />
        <FormulaCard
          tone="violet"
          label="Minus a minus = plus"
          example={
            <>
              <span>8 − (−3) = 8 + 3 = </span>
              <span className="text-emerald-700">11</span>
            </>
          }
        />
      </div>
      <div className="mt-2 text-gray-600 text-[12px]">
        Adding a negative (a + (−b)) does the same thing as subtracting
        (a − b). So flip those to a simpler shape first.
      </div>
    </>
  ),
}

function tip3ForProblem(p) {
  const steps = walkthrough(p)
  return {
    body: (
      <>
        For this problem:
        <div className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <FormulaCard
              key={i}
              tone={s.tone}
              label={s.note}
              example={s.line}
            />
          ))}
        </div>
      </>
    ),
  }
}

function tips(problem) {
  return [TIP_1, TIP_2, tip3ForProblem(problem)]
}

/** Step-by-step decomposition for the current problem. Each step is
 *  one transformation. We first normalise away a negative right
 *  operand (turning `a + (-b)` into `a - b` and `a - (-b)` into
 *  `a + b`), then apply the same/different-sign rule. */
function walkthrough(p) {
  const steps = []
  let { left, op, right } = p

  if (right < 0) {
    const absR = -right
    if (op === '+') {
      steps.push({
        tone: 'sky',
        note: 'Adding a negative is the same as subtracting.',
        line: (
          <>
            {fmt(left)} + ({fmt(right)}) = {fmt(left)} − {absR}
          </>
        ),
      })
      op = '-'
      right = absR
    } else {
      steps.push({
        tone: 'violet',
        note: 'Subtracting a negative is the same as adding.',
        line: (
          <>
            {fmt(left)} − ({fmt(right)}) = {fmt(left)} + {absR}
          </>
        ),
      })
      op = '+'
      right = absR
    }
  }

  // right is now > 0
  if (op === '+') {
    if (left < 0) {
      const absL = -left
      if (absL > right) {
        steps.push({
          tone: 'rose',
          note: 'Different signs — subtract; the bigger magnitude (negative) wins the sign.',
          line: (
            <>
              {fmt(left)} + {right} = −({absL} − {right}) ={' '}
              <b>{fmt(left + right)}</b>
            </>
          ),
        })
      } else if (absL < right) {
        steps.push({
          tone: 'emerald',
          note: 'Different signs — subtract; the bigger magnitude (positive) wins the sign.',
          line: (
            <>
              {fmt(left)} + {right} = +({right} − {absL}) ={' '}
              <b>{fmt(left + right)}</b>
            </>
          ),
        })
      } else {
        steps.push({
          tone: 'sky',
          note: 'Same magnitudes, opposite signs — they cancel.',
          line: (
            <>
              {fmt(left)} + {right} = <b>0</b>
            </>
          ),
        })
      }
    } else {
      steps.push({
        tone: 'emerald',
        note: 'Both positive — just add.',
        line: (
          <>
            {left} + {right} = <b>{left + right}</b>
          </>
        ),
      })
    }
  } else {
    // op === '-', right > 0
    if (left < 0) {
      const absL = -left
      steps.push({
        tone: 'rose',
        note: 'Negative minus a positive — both push further negative. Add the magnitudes and put a minus.',
        line: (
          <>
            {fmt(left)} − {right} = −({absL} + {right}) ={' '}
            <b>{fmt(left - right)}</b>
          </>
        ),
      })
    } else if (left >= right) {
      steps.push({
        tone: 'emerald',
        note: 'Bigger minus smaller — regular subtraction.',
        line: (
          <>
            {left} − {right} = <b>{left - right}</b>
          </>
        ),
      })
    } else {
      steps.push({
        tone: 'rose',
        note: 'Smaller minus bigger — result is negative.',
        line: (
          <>
            {left} − {right} = −({right} − {left}) = <b>{fmt(left - right)}</b>
          </>
        ),
      })
    }
  }

  return steps
}

/** Render an integer with proper minus-sign typography (U+2212). */
function fmt(n) {
  return n < 0 ? `−${-n}` : String(n)
}

// ─── Render ──────────────────────────────────────────────────────────────────

function NumberSpan({ n, size = 'big' }) {
  const sizeCls =
    size === 'big' ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'
  return (
    <span
      className={`${sizeCls} font-bold font-mono tabular-nums ${
        n < 0 ? 'text-rose-600' : 'text-emerald-600'
      }`}
    >
      {fmt(n)}
    </span>
  )
}

function Expression({ problem, hideAnswer, size = 'big' }) {
  const { left, op, right } = problem
  const opSize =
    size === 'big' ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'
  return (
    <div
      className={`${opSize} font-bold font-mono text-gray-500 flex items-baseline justify-center flex-wrap gap-2`}
    >
      <NumberSpan n={left} size={size} />
      <span>{op === '+' ? '+' : '−'}</span>
      {right < 0 ? (
        <span className="text-gray-400">
          (<NumberSpan n={right} size={size} />)
        </span>
      ) : (
        <NumberSpan n={right} size={size} />
      )}
      <span>=</span>
      {hideAnswer ? <span className="text-gray-300">?</span> : null}
    </div>
  )
}

function View({ problem }) {
  return (
    <div className="py-2">
      <Expression problem={problem} hideAnswer />
      <p className="mt-5 text-sm text-gray-500">What's the answer?</p>
    </div>
  )
}

function CorrectView({ problem }) {
  return (
    <div className="py-2">
      <Expression problem={problem} size="medium" />
      <div className="mt-4 inline-block px-6 py-3 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-4xl md:text-5xl font-mono tabular-nums animate-[bounce_0.7s_ease-out]">
        {fmt(problem.answer)}
      </div>
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled }) {
  const v = value ?? ''
  const valid = isValid(v)
  return (
    <div className="mb-4 max-w-md mx-auto">
      <input
        type="text"
        inputMode="text"
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        value={v}
        onChange={(e) => {
          let next = e.target.value
          // Accept ASCII minus, the typographic minus, the en dash —
          // a few keyboards prefer each.
          next = next.replace(/[−–]/g, '-')
          next = next.replace(/[^\-0-9]/g, '')
          if (next.indexOf('-') > 0) {
            next = next[0] + next.slice(1).replace(/-/g, '')
          }
          next = next.slice(0, 4)
          onChange(next)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && valid) onSubmit(v)
        }}
        disabled={disabled}
        placeholder="-3, 7, …"
        className="w-full text-4xl md:text-5xl font-bold text-center font-mono tabular-nums px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-400 outline-none disabled:opacity-50"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onSubmit(v)}
        disabled={disabled || !valid}
        className="mt-3 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3 rounded-2xl text-lg hover:from-sky-600 hover:to-blue-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
      >
        Check Answer
      </button>
    </div>
  )
}

function isValid(s) {
  if (typeof s !== 'string') return false
  const t = s.trim()
  return /^-?\d+$/.test(t)
}

function check(problem, input) {
  const v = (input ?? '').toString().trim()
  if (!isValid(v)) return false
  return parseInt(v, 10) === problem.answer
}

function isComplete(value) {
  return isValid(value)
}

function key(problem) {
  return problem._key
}

function displayAnswer(problem) {
  return fmt(problem.answer)
}

export default {
  id: 'negativeNumbers',
  label: 'Negative Numbers',
  emoji: '🌡️',
  color: 'from-sky-500 to-blue-600',
  bgLight: 'bg-sky-50',
  border: 'border-sky-200',
  description: 'Add and subtract with negative numbers',
  defaultInput: '',
  defaultCount: 10,
  group: 'extra',
  generate,
  View,
  CorrectView,
  Input,
  tips,
  check,
  isComplete,
  key,
  displayAnswer,
}
