import { LIST_PROBLEMS, WORDS } from './complicatedPercentData'

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function countVowels(word) {
  let n = 0
  for (const ch of word) if (VOWELS.has(ch)) n++
  return n
}

// ─── Grid template ───────────────────────────────────────────────────────────

const GRID_CONFIGS = [
  { rows: 10, cols: 10, minShaded: 10, maxShaded: 90 }, // 1% per cell
  { rows: 5,  cols: 4,  minShaded: 2,  maxShaded: 18 }, // 5% per cell
  { rows: 2,  cols: 5,  minShaded: 1,  maxShaded: 9  }, // 10% per cell
]

function generateGrid() {
  const cfg = pick(GRID_CONFIGS)
  const total = cfg.rows * cfg.cols
  const shaded = rand(cfg.minShaded, cfg.maxShaded)
  const answer = (shaded * 100) / total
  return {
    template: 'grid',
    rows: cfg.rows,
    cols: cfg.cols,
    shaded,
    answer,
    _subkey: `${cfg.rows}x${cfg.cols}:${shaded}`,
  }
}

// ─── List template ───────────────────────────────────────────────────────────

function generateList() {
  const entry = pick(LIST_PROBLEMS)
  const q = pick(entry.questions)
  const answer = (q.count * 100) / entry.items.length
  return {
    template: 'list',
    listId: entry.id,
    items: entry.items,
    listLabel: entry.label,
    prompt: q.prompt,
    questionId: q.id,
    answer,
    _subkey: `${entry.id}:${q.id}`,
  }
}

// ─── Word template ───────────────────────────────────────────────────────────

function generateWord() {
  const word = pick(WORDS)
  const kind = Math.random() < 0.5 ? 'vowels' : 'consonants'
  const v = countVowels(word)
  const count = kind === 'vowels' ? v : word.length - v
  const answer = (count * 100) / word.length
  return {
    template: 'word',
    word,
    kind,
    answer,
    _subkey: `${word}:${kind}`,
  }
}

// ─── Generator ───────────────────────────────────────────────────────────────

function generate() {
  const r = Math.random()
  if (r < 1 / 3) return generateGrid()
  if (r < 2 / 3) return generateList()
  return generateWord()
}

// ─── Views ───────────────────────────────────────────────────────────────────

function GridView({ problem, reveal = false }) {
  const { rows, cols, shaded } = problem
  const total = rows * cols
  // 10×10 cells shrink on mobile; 5×4 and 2×5 can be chunkier.
  const cellClass = cols >= 8 ? 'w-5 h-5 md:w-7 md:h-7' : 'w-8 h-8 md:w-10 md:h-10'
  const cells = []
  for (let i = 0; i < total; i++) {
    const filled = i < shaded
    cells.push(
      <div
        key={i}
        className={`${cellClass} border border-gray-300 ${
          filled
            ? reveal
              ? 'bg-pink-400'
              : 'bg-gray-500'
            : 'bg-white'
        }`}
      />
    )
  }
  return (
    <div className="py-2">
      <div
        className="inline-grid gap-0.5 p-1 border-2 border-gray-400 rounded-md bg-gray-50"
        style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}
      >
        {cells}
      </div>
      {!reveal && (
        <p className="mt-4 text-sm text-gray-500">
          What percentage of the grid is shaded?
        </p>
      )}
    </div>
  )
}

function matchesQuestion(item, listId, questionId) {
  const low = item.toLowerCase()
  const first = low[0]
  const len = item.length
  const VOWEL_CHARS = new Set(['a', 'e', 'i', 'o', 'u'])

  if (listId === 'months') {
    switch (questionId) {
      case 'j':          return first === 'j'
      case 'vowel':      return VOWEL_CHARS.has(first)
      case 'firstHalf':  return ['January','February','March','April','May','June'].includes(item)
      case 'secondHalf': return ['July','August','September','October','November','December'].includes(item)
      case 'summer':     return ['June','July','August'].includes(item)
      case 'winter':     return ['December','January','February'].includes(item)
      case 'spring':     return ['March','April','May'].includes(item)
      case 'autumn':     return ['September','October','November'].includes(item)
      case 'notJ':       return first !== 'j'
      case 'hasA':       return low.includes('a')
      case 'long':       return len >= 7
      case 'short':      return len < 7
      default: return false
    }
  }

  if (listId === 'names') {
    switch (questionId) {
      case 'vowel': return VOWEL_CHARS.has(first)
      case 'len5':  return len === 5
      case 'short': return len <= 4
      case 'long':  return len >= 6
      case 'bc':    return first === 'b' || first === 'c'
      case 'ej':    return first >= 'e' && first <= 'j'
      default: return false
    }
  }

  if (listId === 'colors') {
    const primaries = ['Red', 'Blue', 'Yellow']
    switch (questionId) {
      case 'b':       return first === 'b'
      case 'primary': return primaries.includes(item)
      case 'long':    return len >= 5
      case 'len4':    return len === 4
      case 'double':  return /(.)\1/i.test(item)
      case 'vowel':   return VOWEL_CHARS.has(first)
      case 'hasE':    return low.includes('e')
      default: return false
    }
  }

  if (listId === 'fruits') {
    const yellowFruits = ['Banana', 'Lemon']
    switch (questionId) {
      case 'p':      return first === 'p'
      case 'vowel':  return VOWEL_CHARS.has(first)
      case 'long':   return len >= 5
      case 'len4':   return len === 4
      case 'yellow': return yellowFruits.includes(item)
      case 'hasE':   return low.includes('e')
      default: return false
    }
  }

  if (listId === 'sports') {
    const ballSports = ['Soccer', 'Tennis', 'Baseball', 'Basketball']
    const teamSports = ['Soccer', 'Baseball', 'Basketball', 'Hockey']
    switch (questionId) {
      case 'ball': return ballSports.includes(item)
      case 'b':    return first === 'b'
      case 'ing':  return low.endsWith('ing')
      case 'team': return teamSports.includes(item)
      case 's':    return first === 's'
      default: return false
    }
  }

  if (listId === 'weekdays') {
    switch (questionId) {
      case 't':    return first === 't'
      case 'len6': return len === 6
      case 'long': return len >= 7
      case 'hasN': return low.includes('n')
      default: return false
    }
  }

  return false
}

function ListView({ problem, reveal = false }) {
  const { items, listId, questionId, listLabel, prompt } = problem
  return (
    <div className="py-2">
      <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto mb-4">
        {items.map((item) => {
          const matches = reveal && matchesQuestion(item, listId, questionId)
          return (
            <span
              key={item}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                matches
                  ? 'bg-pink-100 border-pink-400 text-pink-700'
                  : reveal
                  ? 'bg-white border-gray-200 text-gray-400'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              {item}
            </span>
          )
        })}
      </div>
      <p className="text-base leading-relaxed text-gray-800">
        What percentage of the <span className="font-semibold">{listLabel}</span>{' '}
        {prompt}?
      </p>
    </div>
  )
}

function WordView({ problem, reveal = false }) {
  const { word, kind } = problem
  return (
    <div className="py-2">
      <div className="flex items-center justify-center text-4xl font-bold tracking-wider font-mono">
        {word.split('').map((ch, i) => {
          const isV = VOWELS.has(ch)
          const isMatch = kind === 'vowels' ? isV : !isV
          const cls = reveal
            ? isMatch
              ? 'text-pink-600'
              : 'text-gray-400'
            : 'text-gray-800'
          return (
            <span key={i} className={`inline-flex items-center justify-center w-7 md:w-9 ${cls}`}>
              {ch}
            </span>
          )
        })}
      </div>
      <p className="mt-4 text-base leading-relaxed text-gray-800">
        What percentage of the letters are{' '}
        <span className="font-semibold">{kind}</span>?
      </p>
    </div>
  )
}

function View({ problem }) {
  if (problem.template === 'grid') return <GridView problem={problem} />
  if (problem.template === 'list') return <ListView problem={problem} />
  return <WordView problem={problem} />
}

function CorrectView({ problem }) {
  const inner =
    problem.template === 'grid' ? <GridView problem={problem} reveal /> :
    problem.template === 'list' ? <ListView problem={problem} reveal /> :
    <WordView problem={problem} reveal />
  return (
    <div className="py-2">
      {inner}
      <div className="mt-4 inline-block px-6 py-3 rounded-2xl bg-pink-100 border-2 border-pink-400 text-pink-700 font-bold text-3xl animate-[bounce_0.7s_ease-out]">
        {problem.answer}%
      </div>
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

function isReady(value) {
  return typeof value === 'string' && /^\d+$/.test(value.trim())
}

function Input({ value, onChange, onSubmit, disabled }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isReady(value) && !disabled) onSubmit()
          }}
          disabled={disabled}
          placeholder="?"
          autoFocus
          className="w-28 text-center text-3xl font-bold border-2 border-gray-200 rounded-2xl px-3 py-3 focus:outline-none focus:border-pink-400 disabled:opacity-50"
        />
        <span className="text-3xl font-bold text-gray-600">%</span>
      </div>
      <button
        onClick={() => onSubmit()}
        disabled={disabled || !isReady(value)}
        className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-pink-600 hover:to-fuchsia-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
      >
        Check Answer
      </button>
    </div>
  )
}

function isComplete(value) {
  return isReady(value)
}

function check(problem, input) {
  const n = parseInt(String(input).trim(), 10)
  return Number.isFinite(n) && n === problem.answer
}

function displayAnswer(problem) {
  return `${problem.answer}%`
}

function key(problem) {
  return `cp:${problem.template}:${problem._subkey}`
}

export default {
  id: 'complicatedPercent',
  label: 'Percent Puzzles',
  emoji: '🎯',
  color: 'from-pink-400 to-pink-600',
  bgLight: 'bg-pink-50',
  border: 'border-pink-200',
  description: 'Find the percentage — grids, lists, and words',
  group: 'extra',
  defaultInput: '',
  defaultCount: 10,
  generate,
  View,
  CorrectView,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
