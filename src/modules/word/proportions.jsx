// All problems share the same proportional reasoning structure:
//   Two pairs establish a rate (rNum units of A per rDen units of B).
//   Given the A-value of a third item, find its B-value.
//
// answer = givenA / rate = k3 * rDen   (always a whole number)

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick(arr, n) {
  return shuffle([...arr]).slice(0, n)
}

// Rates: [rNum, rDen] meaning rNum dollars per rDen units-of-B
const RATES = [
  [3, 2], [2, 1], [5, 2], [4, 1], [3, 1],
  [5, 3], [6, 1], [4, 3], [2, 3], [5, 4],
]

// k multipliers — keep numbers in a friendly range
const K_POOL = [2, 3, 4, 5, 6, 7, 8]

// ─── Contexts ────────────────────────────────────────────────────────────────
// Each context: { buildText(v) → string, unitB, items[] }
// v = { item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }
// aVal = rNum*k (the "given" side), bVal = rDen*k (the "find" side)

const CONTEXTS = [
  {
    unitB: 'oz',
    items: ['apples', 'oranges', 'grapes', 'bananas', 'peaches', 'plums', 'berries'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `At a farmers market, a bag of ${item1} costs $${aVal1} and weighs ${bVal1} oz. ` +
      `A bag of ${item2} costs $${aVal2} and weighs ${bVal2} oz — the same price per ounce. ` +
      `If a bag of ${item3} costs $${aVal3}, how many ounces does it weigh?`,
  },
  {
    unitB: 'oz',
    items: ['flour', 'sugar', 'rice', 'oats', 'pasta', 'cornmeal', 'rye'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `A store sells bulk grains. A scoop of ${item1} costs $${aVal1} and weighs ${bVal1} oz. ` +
      `A scoop of ${item2} costs $${aVal2} and weighs ${bVal2} oz at the same rate. ` +
      `How many ounces of ${item3} can you get for $${aVal3}?`,
  },
  {
    unitB: 'miles',
    items: ['red', 'blue', 'green', 'yellow', 'silver', 'black', 'orange'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `On a highway, a ${item1} car uses $${aVal1} of fuel to travel ${bVal1} miles. ` +
      `A ${item2} car uses $${aVal2} of fuel to travel ${bVal2} miles at the same fuel efficiency. ` +
      `How many miles can a ${item3} car travel on $${aVal3} of fuel?`,
  },
  {
    unitB: 'pages',
    items: ['Emma', 'Liam', 'Ava', 'Noah', 'Mia', 'Ethan', 'Lily'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `${item1} reads ${bVal1} pages every ${aVal1} minutes. ` +
      `${item2} also reads ${bVal2} pages in ${aVal2} minutes at the same pace. ` +
      `How many pages would ${item3} read in ${aVal3} minutes?`,
  },
  {
    unitB: 'cookies',
    items: ['Emma', 'Lily', 'Noah', 'Jake', 'Ava', 'Mia', 'Ethan'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `${item1} uses $${aVal1} worth of ingredients to bake ${bVal1} cookies. ` +
      `${item2} spends $${aVal2} and bakes ${bVal2} cookies using the same recipe. ` +
      `How many cookies can ${item3} bake with $${aVal3}?`,
  },
  {
    unitB: 'tiles',
    items: ['blue', 'white', 'gray', 'beige', 'green', 'terracotta', 'slate'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `A box of ${item1} tiles costs $${aVal1} and covers ${bVal1} square feet. ` +
      `A box of ${item2} tiles costs $${aVal2} and covers ${bVal2} square feet at the same price per square foot. ` +
      `How many square feet will $${aVal3} worth of ${item3} tiles cover?`,
  },
  {
    unitB: 'laps',
    items: ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Riley', 'Casey'],
    buildText: ({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }) =>
      `${item1} burns ${aVal1} calories swimming ${bVal1} laps. ` +
      `${item2} burns ${aVal2} calories swimming ${bVal2} laps at the same rate. ` +
      `How many laps would ${item3} need to swim to burn ${aVal3} calories?`,
  },
]

// ─── Distractor logic ─────────────────────────────────────────────────────────
function makeChoices(answer, rDen, k3, givenA) {
  const candidates = [
    givenA,               // unit confusion: use the "given" value
    rDen * (k3 + 1),      // one step too many
    rDen * (k3 - 1),      // one step too few
    answer * 2,           // doubled
    answer + rDen,        // close above
    answer - rDen,        // close below
    givenA - rDen,        // near given value
  ].filter(c => Number.isInteger(c) && c > 0 && c !== answer)

  const unique = [...new Set(candidates)]
  let pad = 2
  while (unique.length < 3) {
    const v = answer + pad
    if (!unique.includes(v)) unique.push(v)
    pad++
  }

  return shuffle([answer, ...unique.slice(0, 3)])
}

// ─── Generate ─────────────────────────────────────────────────────────────────
function generate() {
  const ctx = CONTEXTS[rand(0, CONTEXTS.length - 1)]
  const [rNum, rDen] = RATES[rand(0, RATES.length - 1)]

  const [k1, k2, k3] = pick(K_POOL, 3)
  const [item1, item2, item3] = pick(ctx.items, 3)

  const aVal1 = rNum * k1, bVal1 = rDen * k1
  const aVal2 = rNum * k2, bVal2 = rDen * k2
  const aVal3 = rNum * k3
  const answer = rDen * k3

  const choices = makeChoices(answer, rDen, k3, aVal3)

  return {
    text: ctx.buildText({ item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }),
    answer,
    choices,
    unitB: ctx.unitB,
    _key: `prop:${ctx.unitB}:${rNum}/${rDen}:${k1},${k2},${k3}`,
  }
}

// ─── View ─────────────────────────────────────────────────────────────────────
function View({ problem }) {
  return (
    <p className="text-sm leading-relaxed text-gray-700 text-left">
      {problem.text}
    </p>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ value, onChange, onSubmit, disabled, problem }) {
  function handleSelect(choice) {
    if (disabled) return
    onChange(choice)
    onSubmit(choice)
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {problem.choices.map((choice) => (
        <button
          key={choice}
          onClick={() => handleSelect(choice)}
          disabled={disabled}
          className={`py-4 rounded-2xl text-xl font-bold border-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-default ${
            value === choice
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
              : 'bg-white border-gray-200 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          {choice} {problem.unitB}
        </button>
      ))}
    </div>
  )
}

// ─── Module interface ─────────────────────────────────────────────────────────
function check(problem, value) {
  return value === problem.answer
}

function isComplete(value) {
  return value !== null && value !== undefined && value !== ''
}

function key(problem) {
  return problem._key
}

function displayAnswer(problem) {
  return `${problem.answer} ${problem.unitB}`
}

export default {
  id: 'proportions',
  label: 'Proportions',
  emoji: '🔗',
  color: 'from-amber-400 to-amber-600',
  bgLight: 'bg-amber-50',
  border: 'border-amber-200',
  description: 'Find the missing value using a rate',
  defaultInput: null,
  group: 'word',
  generate,
  View,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
