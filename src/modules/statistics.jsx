// Statistics — two task kinds under one module:
//
//   • PICTOGRAM: read a per-row icon chart (big icon = 10, small = 5)
//     and answer "how many X liked Y best?". Themes use a single
//     emoji per chart as the "one child" unit. Row counts are rolled
//     per generate, so each theme effectively produces unlimited
//     distinct problems.
//
//   • WORD: text-only "There are TOTAL X. PART do Y. The rest do Z.
//     How many do Z?" — pure subtraction under a kid-relatable
//     story. 10 themes × 20 hand-tuned (total, doer) pairs.
//
// generate() rolls a 50/50 between the two so a Quick Quiz / Mix
// session gets a balanced spread.

// ───────────────────────── shared helpers ──────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(arr) {
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

/** 4 distractor + 1 correct, shuffled. Pool draws from values near the
 *  answer; `step` controls the granularity (5 for pictograms whose
 *  values are multiples of 5, smaller for word problems with arbitrary
 *  remainders).
 */
function makeChoices(answer, step = 5) {
  const offsets =
    step === 5
      ? [5, -5, 10, -10, 15, -15, 20, -20]
      : [2, -2, 5, -5, 8, -8, 10, -10]
  const pool = offsets
    .map((o) => answer + o)
    .filter((n) => n >= 0 && n !== answer)
  const unique = [...new Set(pool)]
  const distractors = shuffle(unique).slice(0, 4)
  return shuffle([answer, ...distractors])
}

// ───────────────────────── pictogram themes ────────────────────────

const PICTOGRAM_THEMES = [
  {
    id: 'fruit-juice',
    title: 'Favourite fruit juice flavour',
    emoji: '🥤',
    unit: 'children',
    categories: ['Orange', 'Apple', 'Grapefruit', 'Blackcurrant', 'Pineapple'],
    question: (cat) => `How many children liked ${cat.toLowerCase()} flavour best?`,
  },
  {
    id: 'sports',
    title: 'Favourite sport',
    emoji: '⚽',
    unit: 'children',
    categories: ['Football', 'Tennis', 'Swimming', 'Cricket', 'Hockey'],
    question: (cat) => `How many children chose ${cat.toLowerCase()}?`,
  },
  {
    id: 'pets',
    title: 'Pets at home',
    emoji: '🐶',
    unit: 'children',
    categories: ['Dog', 'Cat', 'Fish', 'Hamster', 'Rabbit'],
    question: (cat) => `How many children have a ${cat.toLowerCase()}?`,
  },
  {
    id: 'ice-cream',
    title: 'Favourite ice cream flavour',
    emoji: '🍦',
    unit: 'children',
    categories: ['Vanilla', 'Chocolate', 'Strawberry', 'Mint', 'Lemon'],
    question: (cat) => `How many children liked ${cat.toLowerCase()} ice cream best?`,
  },
  {
    id: 'transport',
    title: 'How children travel to school',
    emoji: '🚌',
    unit: 'children',
    categories: ['Walk', 'Bus', 'Car', 'Bike', 'Scooter'],
    question: (cat) => `How many children travel by ${cat.toLowerCase()}?`,
  },
  {
    id: 'books-week',
    title: 'Books read this week',
    emoji: '📚',
    unit: 'books',
    categories: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    question: (cat) => `How many books were read on ${cat}?`,
  },
  {
    id: 'cakes',
    title: 'Cakes sold at the bake sale',
    emoji: '🧁',
    unit: 'cakes',
    categories: ['Chocolate', 'Vanilla', 'Lemon', 'Strawberry', 'Coffee'],
    question: (cat) => `How many ${cat.toLowerCase()} cakes were sold?`,
  },
  {
    id: 'weather',
    title: 'Weather in May',
    emoji: '☀️',
    unit: 'days',
    categories: ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy'],
    question: (cat) => `How many ${cat.toLowerCase()} days were there?`,
  },
  {
    id: 'tv-genre',
    title: 'Favourite TV genre',
    emoji: '📺',
    unit: 'children',
    categories: ['Cartoons', 'Sports', 'News', 'Drama', 'Comedy'],
    question: (cat) => `How many children chose ${cat.toLowerCase()}?`,
  },
  {
    id: 'subjects',
    title: 'Favourite school subject',
    emoji: '🎒',
    unit: 'children',
    categories: ['Maths', 'English', 'Science', 'Art', 'PE'],
    question: (cat) => `How many children chose ${cat}?`,
  },
]

const PICTOGRAM_THEMES_BY_ID = new Map(
  PICTOGRAM_THEMES.map((t) => [t.id, t]),
)

function generatePictogram() {
  const theme = pickRandom(PICTOGRAM_THEMES)
  // Roll a row count per category. Tries up to a few times to avoid
  // the entirely-empty chart (boring and the answer would be 0 for
  // every option). At least one row must be non-zero.
  let rows
  for (let i = 0; i < 5; i++) {
    rows = theme.categories.map((label) => {
      const full = rand(0, 5)
      const half = Math.random() < 0.4 ? 1 : 0
      return { label, full, half, total: full * 10 + half * 5 }
    })
    if (rows.some((r) => r.total > 0)) break
  }
  // Prefer asking about a row with a non-zero count.
  const nonZero = rows.map((r, i) => (r.total > 0 ? i : -1)).filter((i) => i >= 0)
  const askIdx = nonZero.length > 0 ? pickRandom(nonZero) : 0
  const answer = rows[askIdx].total
  return {
    type: 'pictogram',
    themeId: theme.id,
    rows,
    askIdx,
    answer,
    choices: makeChoices(answer, 5),
  }
}

// ─────────────────────── word problem themes ───────────────────────

const WORD_THEMES = [
  {
    id: 'school',
    sentence: (a, b) =>
      `There are ${a} children at Hilltop School. ${b} children walk to school. The rest travel by bus or car.`,
    question: 'How many children travel by bus or car?',
    problems: [
      [360, 262], [400, 287], [250, 178], [320, 245], [500, 367],
      [450, 289], [180, 123], [270, 195], [640, 487], [560, 405],
      [330, 246], [780, 596], [420, 308], [180, 117], [240, 165],
      [610, 488], [350, 286], [420, 339], [290, 228], [510, 412],
    ],
  },
  {
    id: 'balloons',
    sentence: (a, b) =>
      `Lily blew up ${a} balloons for her party. ${b} of them have popped. The rest are still floating.`,
    question: 'How many balloons are still floating?',
    problems: [
      [120, 75], [80, 53], [150, 92], [60, 38], [180, 117],
      [100, 67], [140, 85], [90, 56], [160, 98], [110, 73],
      [200, 137], [70, 42], [130, 85], [85, 51], [175, 119],
      [55, 32], [125, 84], [195, 128], [115, 76], [45, 28],
    ],
  },
  {
    id: 'library',
    sentence: (a, b) =>
      `The library has ${a} books in the children's section. ${b} of them are checked out. The rest are on the shelves.`,
    question: 'How many books are on the shelves?',
    problems: [
      [450, 289], [620, 437], [380, 246], [540, 367], [720, 481],
      [800, 562], [310, 198], [490, 326], [580, 421], [350, 234],
      [670, 498], [240, 156], [520, 348], [430, 291], [610, 444],
      [760, 537], [290, 187], [580, 393], [410, 268], [330, 219],
    ],
  },
  {
    id: 'pizza',
    sentence: (a, b) =>
      `At Sam's pizza party there were ${a} slices of pizza. ${b} slices were eaten. The rest are left.`,
    question: 'How many slices are left?',
    problems: [
      [80, 53], [60, 41], [100, 76], [48, 31], [72, 47],
      [120, 83], [96, 65], [56, 38], [88, 59], [40, 27],
      [64, 43], [108, 77], [84, 56], [50, 33], [76, 49],
      [44, 28], [92, 63], [68, 45], [104, 71], [36, 23],
    ],
  },
  {
    id: 'shelter',
    sentence: (a, b) =>
      `The pet shelter has ${a} dogs waiting for homes. This week ${b} of them got adopted. The rest are still waiting.`,
    question: 'How many dogs are still waiting?',
    problems: [
      [150, 92], [80, 47], [120, 78], [60, 38], [180, 113],
      [110, 67], [95, 58], [140, 88], [50, 31], [170, 109],
      [90, 54], [130, 81], [200, 127], [75, 46], [105, 67],
      [160, 103], [55, 34], [125, 79], [195, 124], [115, 72],
    ],
  },
  {
    id: 'football',
    sentence: (a, b) =>
      `There are ${a} fans at the football match. ${b} of them support the home team. The rest support the away team.`,
    question: 'How many fans support the away team?',
    problems: [
      [500, 312], [800, 567], [620, 398], [950, 689], [350, 218],
      [720, 451], [840, 612], [430, 267], [690, 458], [580, 357],
      [450, 281], [780, 521], [600, 374], [990, 723], [320, 196],
      [660, 408], [510, 318], [870, 645], [410, 256], [770, 537],
    ],
  },
  {
    id: 'orchard',
    sentence: (a, b) =>
      `There are ${a} apples on the tree. ${b} of them are ripe and ready to pick. The rest are still green.`,
    question: 'How many apples are still green?',
    problems: [
      [200, 137], [350, 218], [240, 156], [180, 113], [320, 207],
      [260, 165], [400, 278], [110, 67], [380, 246], [150, 89],
      [290, 184], [340, 217], [220, 138], [170, 102], [310, 198],
      [125, 78], [275, 173], [395, 261], [160, 95], [230, 144],
    ],
  },
  {
    id: 'cinema',
    sentence: (a, b) =>
      `The cinema has ${a} seats. ${b} of them are filled for the new movie. The rest are empty.`,
    question: 'How many seats are empty?',
    problems: [
      [240, 178], [350, 261], [180, 124], [400, 287], [310, 232],
      [270, 198], [450, 326], [220, 156], [380, 283], [160, 109],
      [420, 312], [290, 213], [340, 247], [200, 138], [370, 274],
      [150, 102], [430, 318], [260, 187], [330, 243], [110, 73],
    ],
  },
  {
    id: 'cupcakes',
    sentence: (a, b) =>
      `Mia's bakery made ${a} cupcakes today. ${b} of them are chocolate. The rest are vanilla.`,
    question: 'How many cupcakes are vanilla?',
    problems: [
      [120, 73], [80, 51], [150, 96], [60, 39], [180, 117],
      [100, 64], [140, 89], [90, 57], [160, 103], [110, 71],
      [200, 134], [70, 44], [130, 84], [85, 53], [175, 116],
      [55, 33], [125, 81], [195, 128], [115, 74], [45, 27],
    ],
  },
  {
    id: 'aquarium',
    sentence: (a, b) =>
      `There are ${a} fish in the aquarium. ${b} of them are in the big tank. The rest are in the small tank.`,
    question: 'How many fish are in the small tank?',
    problems: [
      [300, 218], [250, 173], [180, 122], [220, 148], [160, 107],
      [280, 189], [140, 93], [200, 134], [120, 78], [260, 174],
      [100, 67], [240, 161], [80, 51], [190, 127], [150, 98],
      [60, 38], [270, 184], [110, 73], [230, 154], [170, 113],
    ],
  },
]

const WORD_THEMES_BY_ID = new Map(WORD_THEMES.map((t) => [t.id, t]))

function generateWord() {
  const theme = pickRandom(WORD_THEMES)
  const [a, b] = pickRandom(theme.problems)
  const answer = a - b
  return {
    type: 'word',
    themeId: theme.id,
    a,
    b,
    answer,
    choices: makeChoices(answer, 2),
  }
}

// ─────────────────────── module surface ─────────────────────────────

function generate() {
  return Math.random() < 0.5 ? generatePictogram() : generateWord()
}

function PictogramRow({ row, emoji, highlight }) {
  return (
    <div
      className={`flex items-center gap-2 py-1 border-b border-gray-200 last:border-b-0 ${
        highlight ? 'bg-amber-100 -mx-2 px-2 rounded-md' : ''
      }`}
    >
      <div className="w-28 sm:w-32 text-sm font-semibold text-gray-700 shrink-0 text-left">
        {row.label}
      </div>
      <div className="flex items-end gap-0.5 flex-1 flex-wrap">
        {Array.from({ length: row.full }).map((_, i) => (
          <span key={`f${i}`} className="text-2xl leading-none">
            {emoji}
          </span>
        ))}
        {Array.from({ length: row.half }).map((_, i) => (
          <span key={`h${i}`} className="text-sm leading-none">
            {emoji}
          </span>
        ))}
      </div>
    </div>
  )
}

function PictogramTable({ theme, rows, askIdx, revealAnswer }) {
  return (
    <div className="text-gray-800">
      <div className="text-base font-bold text-center mb-2">{theme.title}</div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-3 text-xs text-gray-600">
        <span className="inline-flex items-baseline gap-1">
          <span className="text-2xl leading-none">{theme.emoji}</span>
          <span>= 10 {theme.unit}</span>
        </span>
        <span className="inline-flex items-baseline gap-1">
          <span className="text-sm leading-none">{theme.emoji}</span>
          <span>= 5 {theme.unit}</span>
        </span>
      </div>
      <div className="border-2 border-gray-200 rounded-xl p-2 mb-3 bg-white">
        {rows.map((r, i) => (
          <PictogramRow
            key={r.label}
            row={r}
            emoji={theme.emoji}
            highlight={revealAnswer && i === askIdx}
          />
        ))}
      </div>
      <p className="text-sm font-semibold">
        {theme.question(theme.categories[askIdx])}
      </p>
    </div>
  )
}

function WordView({ problem, theme }) {
  return (
    <div className="text-gray-800">
      <p className="text-base mb-3 leading-relaxed">
        {theme.sentence(problem.a, problem.b)}
      </p>
      <p className="text-base font-semibold">{theme.question}</p>
    </div>
  )
}

function View({ problem }) {
  if (problem.type === 'pictogram') {
    const theme = PICTOGRAM_THEMES_BY_ID.get(problem.themeId)
    if (!theme) return null
    return (
      <PictogramTable
        theme={theme}
        rows={problem.rows}
        askIdx={problem.askIdx}
        revealAnswer={false}
      />
    )
  }
  const theme = WORD_THEMES_BY_ID.get(problem.themeId)
  if (!theme) return null
  return <WordView problem={problem} theme={theme} />
}

function CorrectView({ problem }) {
  if (problem.type === 'pictogram') {
    const theme = PICTOGRAM_THEMES_BY_ID.get(problem.themeId)
    if (!theme) return null
    return (
      <div>
        <PictogramTable
          theme={theme}
          rows={problem.rows}
          askIdx={problem.askIdx}
          revealAnswer={true}
        />
        <div className="mt-4 text-3xl font-bold tabular-nums animate-bounce text-emerald-600">
          {problem.answer}
        </div>
      </div>
    )
  }
  const theme = WORD_THEMES_BY_ID.get(problem.themeId)
  if (!theme) return null
  return (
    <div className="text-gray-800">
      <p className="text-sm mb-3 leading-relaxed">
        {theme.sentence(problem.a, problem.b)}
      </p>
      <p className="text-sm font-semibold mb-4">{theme.question}</p>
      <div className="text-3xl font-bold tabular-nums animate-bounce">
        {problem.a} − {problem.b} ={' '}
        <span className="text-emerald-600">{problem.answer}</span>
      </div>
    </div>
  )
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function Input({ value, onChange, onSubmit, disabled, problem }) {
  function handlePick(choice) {
    if (disabled) return
    onChange(choice)
    onSubmit(choice)
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
      {problem.choices.map((choice, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handlePick(choice)}
          disabled={disabled}
          className={`rounded-2xl border-2 px-3 py-3 font-bold text-lg transition-all cursor-pointer active:scale-95 disabled:cursor-default disabled:opacity-60 ${
            value === choice
              ? 'bg-sky-500 text-white border-sky-500 shadow-md'
              : 'bg-white text-gray-700 border-gray-200 hover:border-sky-300 hover:bg-sky-50'
          }`}
        >
          <span className="text-xs text-gray-400 mr-1">{LETTERS[i]}</span>
          <span className="tabular-nums">{choice}</span>
        </button>
      ))}
    </div>
  )
}

function check(problem, value) {
  return Number(value) === problem.answer
}

function isComplete(value) {
  return value !== null && value !== undefined && value !== ''
}

function key(problem) {
  if (problem.type === 'pictogram') {
    // Snapshot the chart's structure so the same problem reshuffled
    // doesn't count as new.
    const rowSig = problem.rows.map((r) => `${r.full}_${r.half}`).join(',')
    return `stat:p:${problem.themeId}:${problem.askIdx}:${rowSig}`
  }
  return `stat:w:${problem.themeId}:${problem.a}-${problem.b}`
}

function displayAnswer(problem) {
  return String(problem.answer)
}

function tips(problem) {
  if (problem?.type === 'pictogram') {
    return [
      {
        body: (
          <>
            Each <b>big icon</b> stands for 10. Each <b>small icon</b> stands
            for 5.
            <div className="mt-1 text-gray-600">
              Count the icons in the asked row, then add: 10 × (big) + 5 × (small).
            </div>
          </>
        ),
      },
    ]
  }
  return [
    {
      body: (
        <>
          Two groups make a <b>total</b>. The story tells you how many are in
          one group — you need to find the other.
          <div className="mt-1 text-gray-600">
            Take the <b>total</b> and <b>subtract</b> the part you know. What's
            left is the answer.
          </div>
        </>
      ),
    },
  ]
}

export default {
  id: 'statistics',
  label: 'Statistics',
  emoji: '📊',
  color: 'from-sky-400 to-sky-600',
  bgLight: 'bg-sky-50',
  border: 'border-sky-200',
  description: 'Read charts and word problems',
  defaultInput: null,
  group: 'extra',
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
