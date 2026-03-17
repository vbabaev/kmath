// Exchange rate problem:
//   Two items each have a $ price and £ price, establishing the rate.
//   Find the £ price of a third item given its $ price.
//
// Rate: rNum £ per rDen $
// aVal = rDen * k  ($ price)
// bVal = rNum * k  (£ price)
// answer = rNum * k3

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

// £ per $ rates — rNum £ for every rDen $
const RATES = [
  [3, 4],  // £0.75 per $1
  [4, 5],  // £0.80 per $1
  [2, 3],  // £0.67 per $1
  [1, 2],  // £0.50 per $1
  [3, 5],  // £0.60 per $1
  [5, 8],  // £0.625 per $1
  [2, 5],  // £0.40 per $1
  [3, 8],  // £0.375 per $1
]

const K_POOL = [2, 3, 4, 5, 6, 7, 8]

const NAMES = ['Alex', 'Sam', 'Emma', 'Noah', 'Lily', 'Ethan', 'Ava', 'Jake', 'Mia', 'Leo']

const ITEMS = [
  'book', 'hat', 'bag', 'scarf', 'mug', 'poster', 'toy',
  'notebook', 'umbrella', 'keychain', 't-shirt', 'cap',
  'wallet', 'journal', 'puzzle', 'candle', 'pen set',
]

function makeChoices(answer, rNum, rDen, k3, dollarVal, bVal1, bVal2) {
  const candidates = [
    dollarVal,          // confuse $ with £ (very common mistake)
    answer + rNum,      // one step too high
    answer - rNum,      // one step too low
    answer * 2,         // doubled
    bVal1,              // reuse a given £ value
    bVal2,              // reuse the other given £ value
    dollarVal - rDen,   // near the $ value
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

function generate() {
  const [rNum, rDen] = RATES[rand(0, RATES.length - 1)]
  const [k1, k2, k3] = pick(K_POOL, 3)
  const [name] = pick(NAMES, 1)
  const [item1, item2, item3] = pick(ITEMS, 3)

  const aVal1 = rDen * k1,  bVal1 = rNum * k1   // item1: $aVal1 = £bVal1
  const aVal2 = rDen * k2,  bVal2 = rNum * k2   // item2: $aVal2 = £bVal2
  const aVal3 = rDen * k3                        // item3: $aVal3 = £?
  const answer = rNum * k3

  const choices = makeChoices(answer, rNum, rDen, k3, aVal3, bVal1, bVal2)

  return {
    name, item1, item2, item3,
    aVal1, bVal1, aVal2, bVal2, aVal3,
    answer,
    choices,
    _key: `exch:${rNum}/${rDen}:${k1},${k2},${k3}`,
  }
}

function View({ problem }) {
  const { name, item1, item2, item3, aVal1, bVal1, aVal2, bVal2, aVal3 } = problem
  return (
    <div className="text-left space-y-4">
      <p className="text-sm leading-relaxed text-gray-700">
        {name} went shopping in New York and bought a <strong>{item1}</strong> for{' '}
        <strong>${aVal1}</strong> and a <strong>{item2}</strong> for{' '}
        <strong>${aVal2}</strong>. Back home in the UK, they converted both
        prices: the {item1} cost <strong>£{bVal1}</strong> and the {item2}{' '}
        cost <strong>£{bVal2}</strong>.
      </p>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>{item1}</span><span>${aVal1} = £{bVal1}</span>
        </div>
        <div className="border-t border-amber-200" />
        <div className="flex justify-between">
          <span>{item2}</span><span>${aVal2} = £{bVal2}</span>
        </div>
      </div>

      <p className="font-semibold text-gray-800 text-sm">
        Using the same exchange rate, how many <strong>pounds (£)</strong> would
        a <strong>{item3}</strong> cost if it is priced at{' '}
        <strong>${aVal3}</strong>?
      </p>
    </div>
  )
}

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
  return `£${problem.answer}`
}

export default {
  id: 'proportions',
  label: 'Exchange Rate',
  emoji: '💱',
  color: 'from-amber-400 to-amber-600',
  bgLight: 'bg-amber-50',
  border: 'border-amber-200',
  description: 'Convert prices using an exchange rate',
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
