import { WORDS_4, WORDS_5 } from './letterCodesData.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickNonZero(min, max) {
  let n = rand(min, max)
  while (n === 0) n = rand(min, max)
  return n
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Apply a per-position shift to a string of A–Z letters, wrapping at
 *  the alphabet boundaries (Z + 1 → A, A − 1 → Z). */
function applyShifts(letters, shifts) {
  let out = ''
  for (let i = 0; i < letters.length; i++) {
    const code = letters.charCodeAt(i) - 65
    const shifted = (((code + shifts[i]) % 26) + 26) % 26
    out += String.fromCharCode(65 + shifted)
  }
  return out
}

function fmtShift(n) {
  return n > 0 ? `+${n}` : `${n}`
}

// ─── Problem generation ──────────────────────────────────────────────────────

/** Build the per-position shift vector for the chosen rule kind. Every
 *  position's shift is capped at |shift| ≤ 8 — bigger values produce
 *  cumulative shifts in the progressive case that are hard to count
 *  along the alphabet strip. */
const MAX_SHIFT = 8

function makeShifts(kind, length) {
  if (kind === 'simple') {
    const k = pickNonZero(-MAX_SHIFT, MAX_SHIFT)
    return new Array(length).fill(k)
  }
  // progressive: arithmetic progression  s, s+d, s+2d, …
  // Retry until every per-position shift fits inside the cap.
  for (let attempt = 0; attempt < 50; attempt++) {
    const s = pickNonZero(-5, 5)
    const d = pick([-2, -1, 1, 2])
    const out = []
    for (let i = 0; i < length; i++) out.push(s + i * d)
    if (out.every((x) => Math.abs(x) <= MAX_SHIFT)) return out
  }
  // Fallback — a tame +1 progression starting from -2.
  const out = []
  for (let i = 0; i < length; i++) out.push(-2 + i)
  return out
}

/** Helpers for first-letter clustering used by both branches. */
function alphaIndex(letter) {
  return letter.charCodeAt(0) - 65
}
function letterAtOffset(letter, off) {
  return String.fromCharCode(65 + ((alphaIndex(letter) + off + 26 * 100) % 26))
}

/** Decode (code → word) — every choice has to be a real word from the
 *  bank, otherwise the kid spots the answer at a glance. We aim for
 *  6 choices spread across three buckets relative to the answer's
 *  first letter A: two at distance 0 (answer + sibling), two at
 *  distance 1 (one A-1, one A+1), two at distance 2 (one A-2, one A+2). */
function buildChoicesDecode(correct) {
  const length = correct.length
  const pool = length === 4 ? WORDS_4 : WORDS_5
  const first = correct[0]

  const taken = new Set([correct])
  const distractors = []
  function take(word) {
    if (!word || taken.has(word)) return false
    taken.add(word)
    distractors.push(word)
    return true
  }
  function pickOneFrom(filterFn) {
    for (const w of shuffle(pool.filter(filterFn))) {
      if (take(w)) return true
    }
    return false
  }
  function takeWithFirst(letter) {
    return pickOneFrom((w) => w[0] === letter)
  }

  // Same letter sibling.
  takeWithFirst(first)
  // Distance-1 neighbours (one per side).
  takeWithFirst(letterAtOffset(first, -1))
  takeWithFirst(letterAtOffset(first, +1))
  // Distance-2 neighbours.
  takeWithFirst(letterAtOffset(first, -2))
  takeWithFirst(letterAtOffset(first, +2))

  // Fallbacks — a few starting letters in the bank are sparse (Q, U,
  // X, Z). Relax to slightly farther neighbours, then to any unused
  // same-length word in the bank.
  while (distractors.length < 5) {
    const ok =
      takeWithFirst(letterAtOffset(first, -3)) ||
      takeWithFirst(letterAtOffset(first, +3)) ||
      takeWithFirst(first) ||
      pickOneFrom(() => true)
    if (!ok) break
  }

  return shuffle([correct, ...distractors.slice(0, 5)])
}

/** Encode (word → code) — first letters cluster around the correct
 *  code's first letter so the kid can't solve the question by figuring
 *  out the first-letter shift alone. Six options spread across the
 *  same three buckets the decode side uses: 2 at distance 0, 2 at
 *  distance 1 (±1 first letter), and 2 at distance 2 (±2 first letter). */
function buildChoicesEncode(correct, promptInput, shifts, kind) {
  const targetShifts = shifts.slice()
  const taken = new Set([correct])
  const distractors = []

  function tryAdd(c) {
    if (typeof c !== 'string' || c.length !== correct.length) return false
    if (taken.has(c)) return false
    taken.add(c)
    distractors.push(c)
    return true
  }

  // D-same: same first letter as the correct code.
  //   - Progressive: re-use the first shift everywhere (the classic
  //     "I treated it as a simple code" mistake).
  //   - Simple: keep the first shift, perturb the remaining positions
  //     by ±1 so the rest of the code looks different.
  if (kind === 'progressive') {
    tryAdd(applyShifts(promptInput, targetShifts.map(() => targetShifts[0])))
  } else {
    const perturb = Math.random() < 0.5 ? 1 : -1
    const added = tryAdd(
      applyShifts(
        promptInput,
        targetShifts.map((s, i) => (i === 0 ? s : s + perturb)),
      ),
    )
    if (!added) {
      tryAdd(
        applyShifts(
          promptInput,
          targetShifts.map((s, i) => (i === 0 ? s : s - perturb)),
        ),
      )
    }
  }

  // ±1 first letter via a global shift bump.
  tryAdd(applyShifts(promptInput, targetShifts.map((s) => s + 1)))
  tryAdd(applyShifts(promptInput, targetShifts.map((s) => s - 1)))

  // ±2 first letter.
  tryAdd(applyShifts(promptInput, targetShifts.map((s) => s + 2)))
  tryAdd(applyShifts(promptInput, targetShifts.map((s) => s - 2)))

  // Fallbacks — perturb a single position by a small delta.
  let safety = 0
  while (distractors.length < 5 && safety < 100) {
    safety++
    const idx = Math.floor(Math.random() * correct.length)
    const delta = pickNonZero(-3, 3)
    tryAdd(
      applyShifts(
        promptInput,
        targetShifts.map((s, i) => (i === idx ? s + delta : s)),
      ),
    )
  }

  return shuffle([correct, ...distractors.slice(0, 5)])
}

function buildChoices(correct, promptInput, shifts, kind, direction) {
  if (direction === 'decode') return buildChoicesDecode(correct)
  return buildChoicesEncode(correct, promptInput, shifts, kind)
}

function generate() {
  const kind = Math.random() < 0.5 ? 'simple' : 'progressive'
  const direction = Math.random() < 0.5 ? 'encode' : 'decode'
  const length = Math.random() < 0.5 ? 4 : 5
  const pool = length === 4 ? WORDS_4 : WORDS_5

  // Two distinct real words from the pool — one to demonstrate the
  // rule with, one for the kid to apply it to.
  const wordA = pick(pool)
  let wordB = pick(pool)
  while (wordB === wordA) wordB = pick(pool)

  const shifts = makeShifts(kind, length)
  const codeA = applyShifts(wordA, shifts)
  const codeB = applyShifts(wordB, shifts)

  // For both directions the displayed rule is wordA → codeA. The
  // prompt asks the kid to apply the same rule to the second pair —
  // encode shows the word and wants the code; decode shows the code
  // and wants the word.
  const shown = { word: wordA, code: codeA }
  const prompt =
    direction === 'encode'
      ? { input: wordB, kind: 'word' }
      : { input: codeB, kind: 'code' }
  const answer = direction === 'encode' ? codeB : wordB

  const choices = buildChoices(answer, prompt.input, shifts, kind, direction)

  return {
    kind,
    direction,
    length,
    shifts,
    shown,
    prompt,
    answer,
    choices,
    _key: `lc:${kind}:${direction}:${shifts.join(',')}:${wordA}:${wordB}`,
  }
}

// ─── Tips (a.k.a. the in-quiz explainer) ─────────────────────────────────────

function tips(problem) {
  const { kind, shown, shifts } = problem
  const first = shifts[0]
  const tip1 = {
    body: (
      <>
        Find the rule by comparing the first letters:{' '}
        <b className="font-mono">{shown.word[0]}</b> in the word and{' '}
        <b className="font-mono">{shown.code[0]}</b> in the code — that's a
        shift of <b>{fmtShift(first)}</b>.
      </>
    ),
  }
  if (kind === 'simple') {
    return [
      tip1,
      {
        body: (
          <>
            This is a <b>simple</b> code — the <i>same</i> shift works for
            every letter. Apply <b>{fmtShift(first)}</b> to all of them, and
            remember the alphabet wraps around (Z + 1 = A, A − 1 = Z).
          </>
        ),
      },
    ]
  }
  // progressive
  const second = shifts[1]
  const step = second - first
  return [
    tip1,
    {
      body: (
        <>
          This is a <b>progressive</b> code — the shift <i>changes</i> each
          letter. Compare the second letters too:{' '}
          <b className="font-mono">{shown.word[1]}</b> →{' '}
          <b className="font-mono">{shown.code[1]}</b> is a shift of{' '}
          <b>{fmtShift(second)}</b>.
        </>
      ),
    },
    {
      body: (
        <>
          The shifts step by <b>{fmtShift(step)}</b> each letter, so the
          rule is{' '}
          <b className="font-mono">{shifts.map(fmtShift).join(', ')}</b>.
          Apply each shift to the matching letter of the prompt.
        </>
      ),
    },
  ]
}

// ─── Render ──────────────────────────────────────────────────────────────────

function PromptText({ text }) {
  return (
    <span className="font-mono font-bold tracking-wider text-sky-700">
      {text}
    </span>
  )
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Reference strip the kid can glance at to count letter shifts.
 *  Letters in the demo word are amber-tinted, letters in the demo
 *  code are sky-tinted, and overlap (both sets) is violet — so the
 *  positions that the rule connects pop out before counting. */
function AlphabetStrip({ shown }) {
  const wordSet = new Set(shown.word)
  const codeSet = new Set(shown.code)
  return (
    <div className="mt-5 max-w-xl mx-auto">
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 flex items-center justify-center gap-3">
        <span>Alphabet</span>
        <span className="inline-flex items-center gap-1 normal-case tracking-normal">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-200 border border-amber-400" />
          <span className="font-mono">{shown.word}</span>
        </span>
        <span className="inline-flex items-center gap-1 normal-case tracking-normal">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-200 border border-sky-400" />
          <span className="font-mono">{shown.code}</span>
        </span>
      </div>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
      >
        {ALPHABET.map((L, i) => {
          const inWord = wordSet.has(L)
          const inCode = codeSet.has(L)
          let cls = 'border-gray-200 bg-gray-50 text-gray-700'
          let posCls = 'text-gray-400'
          if (inWord && inCode) {
            cls = 'border-violet-300 bg-violet-100 text-violet-900'
            posCls = 'text-violet-600'
          } else if (inWord) {
            cls = 'border-amber-300 bg-amber-100 text-amber-900'
            posCls = 'text-amber-700'
          } else if (inCode) {
            cls = 'border-sky-300 bg-sky-100 text-sky-900'
            posCls = 'text-sky-700'
          }
          return (
            <div key={L} className={`rounded border py-0.5 text-center ${cls}`}>
              <div className="font-mono font-bold text-sm md:text-base leading-tight">
                {L}
              </div>
              <div
                className={`text-[9px] font-medium tabular-nums leading-tight ${posCls}`}
              >
                {i + 1}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function View({ problem }) {
  const { shown, prompt, direction } = problem
  return (
    <div className="py-2 space-y-3">
      <div className="text-xl md:text-2xl font-semibold text-gray-700">
        If the code for <PromptText text={shown.word} /> is{' '}
        <PromptText text={shown.code} />,
      </div>
      <div className="text-xl md:text-2xl font-semibold text-gray-700">
        what is the {direction === 'encode' ? 'code' : 'word'} for{' '}
        <PromptText text={prompt.input} />?
      </div>
      <AlphabetStrip shown={shown} />
    </div>
  )
}

function CorrectView({ problem }) {
  const { shown, prompt, answer } = problem
  return (
    <div className="py-2">
      <div className="text-base md:text-lg text-gray-600 mb-2">
        <PromptText text={shown.word} /> →{' '}
        <PromptText text={shown.code} />, so
      </div>
      <div className="text-base md:text-lg text-gray-600 mb-3">
        <PromptText text={prompt.input} /> →
      </div>
      <div className="inline-block px-6 py-3 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-3xl font-mono tracking-wider animate-[bounce_0.7s_ease-out]">
        {answer}
      </div>
      <AlphabetStrip shown={shown} />
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled, problem }) {
  function handle(c) {
    if (disabled) return
    onChange(c)
    onSubmit(c)
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-w-2xl mx-auto">
      {problem.choices.map((c) => (
        <button
          key={c}
          onClick={() => handle(c)}
          disabled={disabled}
          className={`py-3 rounded-2xl text-xl md:text-2xl font-bold font-mono tracking-wider border-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-default ${
            value === c
              ? 'bg-sky-500 text-white border-sky-500 shadow-md'
              : 'bg-white border-gray-200 text-gray-800 hover:border-sky-300 hover:bg-sky-50'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

function check(problem, value) {
  return value === problem.answer
}

function isComplete(value) {
  return typeof value === 'string' && value.length >= 4
}

function key(problem) {
  return problem._key
}

function displayAnswer(problem) {
  return problem.answer
}

export default {
  id: 'letterCodes',
  label: 'Letter Codes',
  emoji: '🔐',
  color: 'from-sky-400 to-blue-500',
  bgLight: 'bg-sky-50',
  border: 'border-sky-200',
  description: 'Crack a letter shift rule, then apply it to a new word',
  defaultInput: null,
  defaultCount: 10,
  group: 'verbal',
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
