// Roman numerals — 4 question kinds:
//   - numToRomanText : show a number (3–500),  kid types the Roman.
//   - numToRomanMC   : show a number (200–2500), kid picks the Roman.
//   - romanToNumText : show a Roman   (3–500),  kid types the number.
//   - romanToNumMC   : show a Roman   (200–2500), kid picks the number.
// MC gets the bigger range so the kid isn't typing CMXLIX on the
// phone; text gets the smaller range so a slip on V vs X isn't ten
// minutes of frustration.

const ROMAN_PAIRS = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
  ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
  ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
]
const ROMAN_LETTERS = ['I', 'V', 'X', 'L', 'C', 'D', 'M']

function toRoman(n) {
  let s = ''
  let rem = n
  for (const [r, v] of ROMAN_PAIRS) {
    while (rem >= v) {
      s += r
      rem -= v
    }
  }
  return s
}

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

/** Break a number into its place-value summands — drives the
 *  "200 + 40 + 7 = CC + XL + VII" tip and CorrectView reveal. */
function chunkByPlace(n) {
  const out = []
  const t = Math.floor(n / 1000) * 1000
  const h = Math.floor((n % 1000) / 100) * 100
  const tens = Math.floor((n % 100) / 10) * 10
  const o = n % 10
  for (const v of [t, h, tens, o]) if (v > 0) out.push(v)
  return out
}

/** Three numeric distractors close to `n` — preferring small deltas so
 *  the resulting Romans share most of their prefix with the correct
 *  answer (the kid can't pick by shape alone). */
function pickDistractors(n) {
  const deltas = shuffle([
    1, -1, 9, -9, 5, -5, 10, -10, 50, -50, 100, -100,
  ])
  const seen = new Set([n])
  const out = []
  for (const d of deltas) {
    if (out.length >= 3) break
    const v = n + d
    if (v < 1 || v > 4999) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

function generate() {
  const kind = pick([
    'numToRomanText',
    'numToRomanMC',
    'romanToNumText',
    'romanToNumMC',
  ])
  const isMC = kind.endsWith('MC')
  const isToRoman = kind.startsWith('numToRoman')
  const number = isMC ? rand(200, 2500) : rand(3, 500)
  const roman = toRoman(number)

  let choices = null
  let answer
  if (isToRoman) {
    answer = roman
    if (isMC) {
      const distractors = pickDistractors(number).map(toRoman)
      choices = shuffle([roman, ...distractors])
    }
  } else {
    answer = String(number)
    if (isMC) {
      const distractors = pickDistractors(number).map((v) => String(v))
      choices = shuffle([String(number), ...distractors])
    }
  }

  return {
    kind,
    number,
    roman,
    answer,
    choices,
    _key: `roman:${kind}:${number}`,
  }
}

// ─── Tips (the explainer) ────────────────────────────────────────────────────

function tips(problem) {
  const { kind, number, roman } = problem
  const isToRoman = kind.startsWith('numToRoman')

  const t1 = {
    body: (
      <>
        Roman numerals use seven symbols:
        <div className="mt-2 grid grid-cols-7 gap-1 font-mono text-center text-gray-800 dark:text-gray-200 text-sm">
          {[
            ['I', '1'], ['V', '5'], ['X', '10'], ['L', '50'],
            ['C', '100'], ['D', '500'], ['M', '1000'],
          ].map(([r, v]) => (
            <div
              key={r}
              className="bg-amber-50 border border-amber-200 rounded p-1"
            >
              <div className="font-bold text-amber-700">{r}</div>
              <div className="text-[10px] tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-gray-600">
          Numerals are written from <b>largest to smallest</b> and you add
          them up.
        </div>
      </>
    ),
  }

  const t2 = {
    body: (
      <>
        When a smaller numeral sits <i>before</i> a bigger one, you{' '}
        <b>subtract</b> it. Six of these subtractive pairs cover all the
        digits that would otherwise need four repeats (IIII, XXXX, …):
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-1 font-mono text-center text-gray-800 dark:text-gray-200 text-sm">
          {[
            ['IV', '4'], ['IX', '9'], ['XL', '40'],
            ['XC', '90'], ['CD', '400'], ['CM', '900'],
          ].map(([r, v]) => (
            <div
              key={r}
              className="bg-amber-50 border border-amber-200 rounded p-1"
            >
              <div className="font-bold text-amber-700">{r}</div>
              <div className="text-[10px] tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-gray-600">
          So <b>4 = IV</b>, never IIII. <b>9 = IX</b>, never VIIII.
        </div>
      </>
    ),
  }

  const chunks = chunkByPlace(number)
  const numStr = chunks.join(' + ')
  const romStr = chunks.map(toRoman).join(' + ')
  const t3 = {
    body: isToRoman ? (
      <>
        Break the number by <b>place value</b> — thousands, then
        hundreds, tens, ones — and convert each piece on its own:
        <div className="mt-2 font-mono text-gray-700 dark:text-gray-300 text-base">
          {number} = {numStr}
        </div>
        <div className="mt-1 font-mono text-gray-700 dark:text-gray-300 text-base">
          = {romStr} = <b className="text-amber-700 dark:text-amber-400">{roman}</b>
        </div>
      </>
    ) : (
      <>
        Read the Roman <b>left to right</b>, splitting it into the
        biggest chunks you can — each chunk is one place value:
        <div className="mt-2 font-mono text-gray-700 dark:text-gray-300 text-base">
          {roman} = {romStr}
        </div>
        <div className="mt-1 font-mono text-gray-700 dark:text-gray-300 text-base">
          = {numStr} = <b className="text-amber-700 dark:text-amber-400">{number}</b>
        </div>
      </>
    ),
  }

  return [t1, t2, t3]
}

// ─── Render ──────────────────────────────────────────────────────────────────

function View({ problem }) {
  const { kind, number, roman } = problem
  const isToRoman = kind.startsWith('numToRoman')
  const isMC = kind.endsWith('MC')
  return (
    <div className="py-2">
      <div
        className={`font-bold text-gray-800 ${
          isToRoman
            ? 'text-6xl md:text-7xl tabular-nums'
            : 'text-5xl md:text-6xl font-mono tracking-wider'
        }`}
      >
        {isToRoman ? number : roman}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        {isToRoman
          ? isMC
            ? 'Pick the Roman numeral.'
            : 'Write this number in Roman numerals.'
          : isMC
            ? 'Pick the number.'
            : 'What number does this Roman numeral mean?'}
      </p>
    </div>
  )
}

function CorrectView({ problem }) {
  const { kind, number, roman, answer } = problem
  const isToRoman = kind.startsWith('numToRoman')
  const prompt = isToRoman ? String(number) : roman
  return (
    <div className="py-2">
      <div className="text-3xl md:text-4xl font-bold font-mono text-gray-600 tracking-wider">
        {prompt}
        <span className="text-gray-400 mx-3">=</span>
      </div>
      <div className="mt-3 inline-block px-6 py-3 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-3xl md:text-4xl font-mono tracking-wider animate-[bounce_0.7s_ease-out]">
        {answer}
      </div>
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled, problem }) {
  const { kind, choices } = problem
  const isMC = kind.endsWith('MC')

  if (isMC) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-4 max-w-md mx-auto">
        {choices.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(c)
              onSubmit(c)
            }}
            className={`py-3 rounded-2xl text-xl md:text-2xl font-bold font-mono tracking-wider border-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-default ${
              value === c
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-white border-gray-200 text-gray-800 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    )
  }

  // Text-input modes. We provide our own Check Answer because Quiz.jsx
  // hides its global one whenever a module exposes a custom Input.
  const isRoman = kind === 'numToRomanText'
  const v = value ?? ''
  return (
    <div className="mb-4 max-w-md mx-auto">
      <input
        type="text"
        inputMode={isRoman ? 'text' : 'numeric'}
        autoCapitalize={isRoman ? 'characters' : 'none'}
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        value={v}
        onChange={(e) => {
          let next = e.target.value
          if (isRoman) {
            next = next.toUpperCase().replace(/[^IVXLCDM]/g, '')
          } else {
            next = next.replace(/[^0-9]/g, '').slice(0, 4)
          }
          onChange(next)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && v.trim() !== '') onSubmit(v)
        }}
        disabled={disabled}
        placeholder={isRoman ? 'Type Roman numerals' : 'Type the number'}
        className="w-full text-3xl md:text-4xl font-bold text-center font-mono tracking-wider px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-amber-400 outline-none disabled:opacity-50"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onSubmit(v)}
        disabled={disabled || v.trim() === ''}
        className="mt-3 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-2xl text-lg hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
      >
        Check Answer
      </button>
    </div>
  )
}

function check(problem, input) {
  const v = typeof input === 'string' ? input.trim() : ''
  if (!v) return false
  if (problem.kind === 'numToRomanText') {
    return v.toUpperCase().replace(/[^IVXLCDM]/g, '') === problem.answer
  }
  if (problem.kind === 'romanToNumText') {
    const n = parseInt(v, 10)
    return !Number.isNaN(n) && n === Number(problem.answer)
  }
  // MC: button value === answer
  return v === problem.answer
}

function isComplete(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function key(problem) {
  return problem._key
}

function displayAnswer(problem) {
  return problem.answer
}

export default {
  id: 'roman',
  label: 'Roman Numerals',
  emoji: '🏛️',
  color: 'from-amber-500 to-orange-600',
  bgLight: 'bg-amber-50',
  border: 'border-amber-200',
  description: 'Translate between numbers and Roman numerals',
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
