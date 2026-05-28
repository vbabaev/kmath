// Story-subtraction word problems: a fixed total, a partial count
// that did "X", and we need to find the rest. Modelled on the
// Hilltop School pictogram-quiz style.
//
// 10 themes (variations) × 20 hand-tuned (total, doer) pairs each
// = 200 distinct stories. The narrative comes from the theme; the
// numbers come from the pair. Distractors are generated fresh per
// call from values near the answer so the kid sees a different
// shuffle every encounter, but the correct value is always pulled
// from the deterministic data.

const THEMES = [
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

const THEMES_BY_ID = new Map(THEMES.map((t) => [t.id, t]))

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

/** Build a 5-choice MC list around the correct answer.
 *  Picks 4 distractors from values close to the answer (±2, ±5, ±8,
 *  ±10), filtering negatives and any collision with the answer.
 */
function makeChoices(answer) {
  const pool = [
    answer + 2, answer - 2,
    answer + 5, answer - 5,
    answer + 8, answer - 8,
    answer + 10, answer - 10,
  ].filter((n) => n > 0 && n !== answer)
  // Dedup in case ±2 and ±some land on the same value (shouldn't, but
  // be defensive when answer is tiny).
  const unique = [...new Set(pool)]
  const distractors = shuffle(unique).slice(0, 4)
  return shuffle([answer, ...distractors])
}

function generate() {
  const theme = pickRandom(THEMES)
  const [a, b] = pickRandom(theme.problems)
  const answer = a - b
  return {
    themeId: theme.id,
    a,
    b,
    answer,
    choices: makeChoices(answer),
  }
}

function View({ problem }) {
  const theme = THEMES_BY_ID.get(problem.themeId)
  if (!theme) return null
  return (
    <div className="text-gray-800">
      <p className="text-base mb-3 leading-relaxed">
        {theme.sentence(problem.a, problem.b)}
      </p>
      <p className="text-base font-semibold">{theme.question}</p>
    </div>
  )
}

function CorrectView({ problem }) {
  const theme = THEMES_BY_ID.get(problem.themeId)
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
  return `storySub:${problem.themeId}:${problem.a}-${problem.b}`
}

function displayAnswer(problem) {
  return String(problem.answer)
}

function tips() {
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
  id: 'storySubtraction',
  label: 'Story Subtraction',
  emoji: '🎒',
  color: 'from-sky-400 to-sky-600',
  bgLight: 'bg-sky-50',
  border: 'border-sky-200',
  description: 'Word problems: total − part = the rest',
  defaultInput: null,
  group: 'extra',
  subgroup: 'word',
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
