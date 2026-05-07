const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]
const SQUARES = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]   // 1²..12²
const CUBES = [1, 8, 27, 64, 125, 216]                              // 1³..6³

// Plausible non-members of each set, used when corrupting wrong rows.
// Verified: nothing in *_DECOYS belongs to its target set.
const PRIME_DECOYS = [1, 9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 55, 57]
const SQUARE_DECOYS = [8, 10, 12, 18, 20, 27, 32, 50, 60, 72, 90, 99, 108, 125, 132]
const CUBE_DECOYS = [16, 25, 36, 49, 50, 81, 100, 121, 144, 200]

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

function isAllCorrect(row) {
  return PRIMES.includes(row.prime) && SQUARES.includes(row.square) && CUBES.includes(row.cube)
}

function makeCorrectRow() {
  return { prime: pick(PRIMES), square: pick(SQUARES), cube: pick(CUBES) }
}

function makeWrongRow() {
  const row = makeCorrectRow()
  const numCorrupt = Math.random() < 0.5 ? 1 : 2
  const fields = shuffle(['prime', 'square', 'cube']).slice(0, numCorrupt)
  for (const f of fields) {
    if (f === 'prime') row.prime = pick(PRIME_DECOYS)
    else if (f === 'square') row.square = pick(SQUARE_DECOYS)
    else row.cube = pick(CUBE_DECOYS)
  }
  return row
}

function rowKey(r) {
  return `${r.prime},${r.square},${r.cube}`
}

function generate() {
  const correct = makeCorrectRow()
  const wrongs = []
  const seen = new Set([rowKey(correct)])
  let tries = 0
  while (wrongs.length < 4 && tries < 200) {
    tries++
    const w = makeWrongRow()
    if (isAllCorrect(w)) continue
    const k = rowKey(w)
    if (seen.has(k)) continue
    seen.add(k)
    wrongs.push(w)
  }
  const rows = shuffle([correct, ...wrongs])
  const correctKey = rowKey(correct)
  const answer = rows.findIndex((r) => rowKey(r) === correctKey)
  return { rows, answer }
}

function View() {
  return (
    <div className="text-center">
      <p className="text-lg md:text-xl font-semibold text-gray-700">
        Which row has all three correct?
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Prime &lt; 60 · Square ≤ 144 · Cube ≤ 216
      </p>
    </div>
  )
}

function Row({ index, row, value, disabled, correctIndex, feedback, onClick }) {
  const isSelected = value === index
  const isCorrect = correctIndex === index
  const showCorrect = feedback === 'correct' && isSelected
  const showWrongPick = feedback === 'wrong' && isSelected
  const showAnswerHint = feedback === 'wrong' && isCorrect

  let cls = 'bg-white border-gray-200 text-gray-800 hover:border-violet-300 hover:bg-violet-50'
  if (showCorrect) cls = 'bg-green-100 border-green-500 text-green-800 shadow-md'
  else if (showWrongPick) cls = 'bg-rose-100 border-rose-400 text-rose-800'
  else if (showAnswerHint) cls = 'bg-green-50 border-green-400 text-green-800'
  else if (isSelected) cls = 'bg-violet-500 text-white border-violet-500 shadow-md'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full grid grid-cols-[40px_1fr_1fr_1fr] gap-2 py-3 px-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] disabled:cursor-default ${cls}`}
    >
      <div className="font-bold text-lg flex items-center justify-center">
        {String.fromCharCode(65 + index)}
      </div>
      <div className="text-center text-xl font-mono font-semibold">{row.prime}</div>
      <div className="text-center text-xl font-mono font-semibold">{row.square}</div>
      <div className="text-center text-xl font-mono font-semibold">{row.cube}</div>
    </button>
  )
}

function Input({ value, onChange, onSubmit, disabled, problem }) {
  const handle = (i) => {
    if (disabled) return
    onChange(i)
    onSubmit(i)
  }
  // Surface feedback by inferring from disabled+selection: when disabled and
  // value matches the answer, it's correct; when disabled and value differs,
  // it's wrong. (Quiz keeps Input visible-but-disabled after submit.)
  let feedback = null
  if (disabled && value !== null && value !== undefined) {
    feedback = value === problem.answer ? 'correct' : 'wrong'
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 px-3 pb-2 text-xs md:text-sm font-semibold text-gray-600">
        <div></div>
        <div className="text-center">Prime</div>
        <div className="text-center">Square</div>
        <div className="text-center">Cube</div>
      </div>
      <div className="space-y-2 mb-4">
        {problem.rows.map((row, i) => (
          <Row
            key={i}
            index={i}
            row={row}
            value={value}
            disabled={disabled}
            correctIndex={problem.answer}
            feedback={feedback}
            onClick={() => handle(i)}
          />
        ))}
      </div>
    </div>
  )
}

function check(problem, value) {
  return value === problem.answer
}

function isComplete(value) {
  return value !== null && value !== undefined
}

function key(problem) {
  return `psc:${problem.rows.map(rowKey).slice().sort().join('|')}`
}

function displayAnswer(problem) {
  return `Row ${String.fromCharCode(65 + problem.answer)}`
}

export default {
  id: 'primeSquareCubic',
  label: 'Number Trio',
  emoji: '🎲',
  color: 'from-violet-400 to-violet-600',
  bgLight: 'bg-violet-50',
  border: 'border-violet-200',
  description: 'Spot the row with a prime, a square, and a cube',
  defaultInput: null,
  defaultCount: 10,
  group: 'extra',
  generate,
  View,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
