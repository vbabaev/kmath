// Divisibility module — "Can N be divided by D?" with a yes/no answer.
// D is drawn from a fixed set of "divisibility-rule" divisors; N is a
// 2-3 digit number balanced 50/50 between yes and no answers.
//
// One tip per divisor explains the rule for that divisor. The Quiz
// renders the tip on demand via module.tips(problem); the kid can
// always ignore the button if they want to try unaided first.

const DIVISORS = [2, 3, 4, 5, 7, 9, 10]
const N_MIN = 10
const N_MAX = 200

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickMultiple(d) {
  // A random multiple of d in [N_MIN, N_MAX].
  const lo = Math.ceil(N_MIN / d)
  const hi = Math.floor(N_MAX / d)
  return d * rand(lo, hi)
}

function pickNonMultiple(d) {
  // Reject-sample: cheap, the rejection rate is at worst 1/2.
  for (let i = 0; i < 50; i++) {
    const n = rand(N_MIN, N_MAX)
    if (n % d !== 0) return n
  }
  return rand(N_MIN, N_MAX) // safety fallback
}

// Module-level toggle that strictly alternates yes/no across calls.
// Random initial side so consecutive quizzes don't all start with the
// same answer; from then on every other call flips. With defaultCount
// of 10 this gives a guaranteed exact 5/5 split per quiz, regardless
// of how the queue ends up shuffled.
let nextWantsDivisible = Math.random() < 0.5

function generate() {
  const d = DIVISORS[rand(0, DIVISORS.length - 1)]
  const wantDivisible = nextWantsDivisible
  nextWantsDivisible = !nextWantsDivisible
  const n = wantDivisible ? pickMultiple(d) : pickNonMultiple(d)
  return { n, d, answer: n % d === 0 }
}

function View({ problem }) {
  const { n, d } = problem
  return (
    <div className="py-2 text-gray-800">
      <div className="text-gray-500 text-base mb-2">Can</div>
      <div className="text-5xl font-bold tabular-nums">{n}</div>
      <div className="text-gray-500 text-base my-2">be divided by</div>
      <div className="text-5xl font-bold tabular-nums">{d}</div>
      <div className="text-gray-500 text-base mt-2">?</div>
    </div>
  )
}

function CorrectView({ problem }) {
  const { n, d, answer } = problem
  if (answer) {
    return (
      <div className="py-2 text-gray-800">
        <div className="text-3xl font-bold mb-3">{n} ÷ {d} = {n / d}</div>
        <div className="inline-block text-3xl font-bold text-emerald-600 bg-emerald-100 border-2 border-emerald-300 rounded-2xl px-6 py-3 animate-bounce">
          ✓ Yes
        </div>
      </div>
    )
  }
  const q = Math.floor(n / d)
  const r = n - q * d
  return (
    <div className="py-2 text-gray-800">
      <div className="text-3xl font-bold mb-3">
        {n} ÷ {d} = {q} <span className="text-red-500">r {r}</span>
      </div>
      <div className="inline-block text-3xl font-bold text-rose-600 bg-rose-100 border-2 border-rose-300 rounded-2xl px-6 py-3 animate-bounce">
        ✗ No
      </div>
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled }) {
  function handleSelect(v) {
    if (disabled) return
    onChange(v)
    onSubmit(v)
  }
  return (
    <div className="flex justify-center gap-4 mb-4">
      {[
        { v: 'yes', label: 'Yes', activeClass: 'bg-emerald-500 border-emerald-500' },
        { v: 'no', label: 'No', activeClass: 'bg-rose-500 border-rose-500' },
      ].map(({ v, label, activeClass }) => (
        <button
          key={v}
          type="button"
          onClick={() => handleSelect(v)}
          disabled={disabled}
          className={`w-28 h-16 rounded-2xl text-2xl font-bold border-2 transition-all cursor-pointer active:scale-90 disabled:opacity-50 disabled:cursor-default ${
            value === v
              ? `${activeClass} text-white shadow-md`
              : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function check(problem, value) {
  const expected = problem.answer ? 'yes' : 'no'
  return value === expected
}

function isComplete(value) {
  return value === 'yes' || value === 'no'
}

function key(problem) {
  return `div:${problem.n}:${problem.d}`
}

function displayAnswer(problem) {
  return problem.answer ? 'Yes' : 'No'
}

// One tip per divisor — the rule for the divisor in the current
// problem. Kept short so the kid can read at a glance.
const TIPS_BY_DIVISOR = {
  2: {
    body: (
      <>
        Look at the <b>last digit</b>. If it's <b>0, 2, 4, 6, or 8</b>, the number is divisible by 2.
      </>
    ),
  },
  3: {
    body: (
      <>
        <b>Add the digits.</b> If the sum is divisible by 3, the number is too.
        <div className="mt-1 text-gray-600">
          e.g. <b>126</b> → 1 + 2 + 6 = 9, and 9 ÷ 3 = 3, so 126 is divisible by 3.
        </div>
      </>
    ),
  },
  4: {
    body: (
      <>
        Look at the <b>last two digits</b>. If that two-digit number is divisible by 4, the whole number is.
        <div className="mt-1 text-gray-600">e.g. <b>132</b> → 32 ÷ 4 = 8, so yes.</div>
      </>
    ),
  },
  5: {
    body: (
      <>
        Look at the <b>last digit</b>. If it's <b>0 or 5</b>, the number is divisible by 5.
      </>
    ),
  },
  7: {
    body: (
      <>
        No quick rule — just try dividing. A handy shortcut: double the last digit and subtract it from the rest. If the result is divisible by 7, the original is too.
        <div className="mt-1 text-gray-600">
          e.g. <b>91</b> → 9 − (1×2) = 7, and 7 ÷ 7 = 1, so yes.
        </div>
      </>
    ),
  },
  9: {
    body: (
      <>
        <b>Add the digits.</b> If the sum is divisible by 9, so is the number.
        <div className="mt-1 text-gray-600">
          e.g. <b>117</b> → 1 + 1 + 7 = 9, so 117 is divisible by 9.
        </div>
      </>
    ),
  },
  10: {
    body: (
      <>
        Look at the <b>last digit</b>. If it's <b>0</b>, the number is divisible by 10.
      </>
    ),
  },
}

function tips(problem) {
  const t = TIPS_BY_DIVISOR[problem.d]
  return t ? [t] : []
}

export default {
  id: 'divisibility',
  label: 'Divisibility',
  emoji: '🔍',
  color: 'from-teal-400 to-teal-600',
  bgLight: 'bg-teal-50',
  border: 'border-teal-200',
  description: 'Spot which numbers divide evenly into others',
  defaultInput: null,
  group: 'school',
  defaultCount: 10,
  generate,
  View,
  CorrectView,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
  tips,
}
