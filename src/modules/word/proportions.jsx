// Exchange rate problem:
//   Two items each have a $ and £ price, establishing the rate.
//   Find the £ price of a third item given its $ price.
//
// Rate: rNum £ per rDen $  →  answer = rNum * k3

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

// ─── Rates: [rNum £, rDen $] ─────────────────────────────────────────────────
const RATES = [
  [3, 4],  [4, 5],  [2, 3],  [1, 2],
  [3, 5],  [5, 8],  [2, 5],  [3, 8],
]

const K_POOL = [2, 3, 4, 5, 6, 7, 8]

// ─── People & things ─────────────────────────────────────────────────────────
const NAMES = [
  'Alex', 'Sam', 'Emma', 'Noah', 'Lily', 'Ethan', 'Ava',
  'Jake', 'Mia', 'Leo', 'Ruby', 'Oscar', 'Isla', 'Finn',
]

const ITEMS = [
  // clothing & accessories
  'hat', 'cap', 'scarf', 't-shirt', 'hoodie', 'jacket', 'gloves',
  'socks', 'sunglasses', 'backpack', 'wallet', 'tote bag', 'beanie', 'belt',
  // drinkware & food
  'mug', 'water bottle', 'travel mug', 'thermos', 'candy tin', 'cookie tin', 'snack box',
  // stationery & books
  'notebook', 'journal', 'book', 'pen set', 'sticker pack', 'sketchbook', 'postcard set',
  'planner', 'bookmark set', 'calendar',
  // toys & games
  'puzzle', 'card game', 'keychain', 'yo-yo', 'fidget cube',
  // souvenirs & misc
  'poster', 'pin badge', 'snow globe', 'candle', 'umbrella',
  'phone stand', 'fridge magnet', 'tote bag',
]

// ─── Settings ────────────────────────────────────────────────────────────────
// Each setting: { setup(v), question(v) } → strings
// v = { name, item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }

const SETTINGS = [
  {
    setup: ({ name, item1, item2, aVal1, aVal2, bVal1, bVal2 }) =>
      `${name} was on a trip to New York and picked up a ${item1} for $${aVal1} ` +
      `and a ${item2} for $${aVal2}. Back home they worked out it came to ` +
      `£${bVal1} for the ${item1} and £${bVal2} for the ${item2}.`,
    question: ({ item3, aVal3 }) =>
      `They also spotted a ${item3} for $${aVal3}. How much is that in pounds?`,
  },
  {
    setup: ({ name, item1, item2, aVal1, aVal2, bVal1, bVal2 }) =>
      `${name} ordered a ${item1} and a ${item2} from an American website — ` +
      `$${aVal1} and $${aVal2}. The bank statement showed £${bVal1} and £${bVal2} ` +
      `once the currency got converted.`,
    question: ({ item3, aVal3 }) =>
      `They're also thinking of grabbing a ${item3} listed at $${aVal3}. What would that be in £?`,
  },
  {
    setup: ({ name, item1, item2, aVal1, aVal2, bVal1, bVal2 }) =>
      `Passing through a US airport, ${name} grabbed a ${item1} for $${aVal1} ` +
      `and a ${item2} for $${aVal2}. The bank later charged £${bVal1} and £${bVal2} ` +
      `at the same exchange rate.`,
    question: ({ item3, aVal3 }) =>
      `There's a ${item3} in the next shop for $${aVal3}. What's that in pounds?`,
  },
  {
    setup: ({ name, item1, item2, aVal1, aVal2, bVal1, bVal2 }) =>
      `${name} was browsing a street market in Chicago and bought a ${item1} for $${aVal1} ` +
      `and a ${item2} for $${aVal2}. Converting the prices came to £${bVal1} and £${bVal2}.`,
    question: ({ item3, aVal3 }) =>
      `They spot a ${item3} on another stall for $${aVal3}. What's that in pounds?`,
  },
  {
    setup: ({ name, item1, item2, aVal1, aVal2, bVal1, bVal2 }) =>
      `At a fan shop in Boston, ${name} picked up a ${item1} for $${aVal1} ` +
      `and a ${item2} for $${aVal2}. In pounds that was £${bVal1} and £${bVal2}.`,
    question: ({ item3, aVal3 }) =>
      `There's also a ${item3} going for $${aVal3}. How much is that in £?`,
  },
]

// ─── Distractors ─────────────────────────────────────────────────────────────
function makeChoices(answer, rNum, k3, dollarVal, bVal1, bVal2) {
  const candidates = [
    dollarVal,        // confuse $ with £
    answer + rNum,    // one step up
    answer - rNum,    // one step down
    answer * 2,       // doubled
    bVal1,            // a given £ value
    bVal2,            // the other given £ value
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
  const [rNum, rDen] = RATES[rand(0, RATES.length - 1)]
  const [k1, k2, k3] = pick(K_POOL, 3)
  const [name] = pick(NAMES, 1)
  const [item1, item2, item3] = pick(ITEMS, 3)
  const setting = SETTINGS[rand(0, SETTINGS.length - 1)]

  const aVal1 = rDen * k1,  bVal1 = rNum * k1
  const aVal2 = rDen * k2,  bVal2 = rNum * k2
  const aVal3 = rDen * k3
  const answer = rNum * k3

  const v = { name, item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 }

  return {
    story: setting.setup(v),
    question: setting.question(v),
    item1, item2, item3,
    aVal1, bVal1, aVal2, bVal2, aVal3,
    answer,
    choices: makeChoices(answer, rNum, k3, aVal3, bVal1, bVal2),
    _key: `exch:${rNum}/${rDen}:${k1},${k2},${k3}`,
  }
}

// ─── View ────────────────────────────────────────────────────────────────────
function View({ problem }) {
  const { story, question, item1, item2, aVal1, bVal1, aVal2, bVal2 } = problem
  return (
    <div className="text-left space-y-3">
      <p className="text-sm leading-relaxed text-gray-700">{story}</p>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-gray-700 space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">{item1}</span>
          <span>${aVal1} = £{bVal1}</span>
        </div>
        <div className="border-t border-amber-200" />
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">{item2}</span>
          <span>${aVal2} = £{bVal2}</span>
        </div>
      </div>

      <p className="font-semibold text-gray-800 text-sm">{question}</p>
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
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
          £{choice}
        </button>
      ))}
    </div>
  )
}

// ─── Module interface ─────────────────────────────────────────────────────────
function check(problem, value) { return value === problem.answer }
function isComplete(value) { return value !== null && value !== undefined && value !== '' }
function key(problem) { return problem._key }
function displayAnswer(problem) { return `£${problem.answer}` }

export default {
  id: 'proportions',
  label: 'Exchange Rate',
  emoji: '💱',
  color: 'from-amber-400 to-amber-600',
  bgLight: 'bg-amber-50',
  border: 'border-amber-200',
  description: 'Convert prices using an exchange rate',
  defaultInput: null,
  defaultCount: 5,
  group: 'extra',
  subgroup: 'word',
  generate,
  View,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
