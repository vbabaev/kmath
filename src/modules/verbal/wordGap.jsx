import { WORDS } from './wordGapData'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generate() {
  const entry = WORDS[rand(0, WORDS.length - 1)]
  const config = entry.configs[rand(0, entry.configs.length - 1)]
  const decoys = shuffle(config.decoys).slice(0, 4)
  const choices = shuffle([config.answer, ...decoys])
  return {
    word: entry.word,
    pos: config.pos,
    answer: config.answer,
    choices,
    _key: `wg:${entry.word}:${config.pos}`,
  }
}

function Letter({ ch, tone = 'solid' }) {
  const base = 'inline-flex items-center justify-center w-7 md:w-9'
  const styles =
    tone === 'gap'
      ? 'text-emerald-400'
      : tone === 'muted'
      ? 'text-gray-400'
      : tone === 'reveal'
      ? 'text-emerald-600'
      : 'text-gray-800'
  return <span className={`${base} ${styles}`}>{ch}</span>
}

function View({ problem }) {
  const { word, pos } = problem
  const before = word.slice(0, pos)
  const after = word.slice(pos + 3)
  const visible = before + after
  return (
    <div className="py-2">
      <div className="flex items-center justify-center text-4xl font-bold tracking-wider font-mono">
        {visible.split('').map((ch, i) => <Letter key={`v${i}`} ch={ch} />)}
      </div>
      <p className="mt-4 text-sm text-gray-500 leading-relaxed">
        Which 3 letters complete the word?
      </p>
    </div>
  )
}

function CorrectView({ problem }) {
  const { word, pos, answer } = problem
  const before = word.slice(0, pos)
  const after = word.slice(pos + 3)
  return (
    <div className="py-2">
      <div className="flex items-center justify-center text-4xl font-bold tracking-wider font-mono">
        {before.split('').map((ch, i) => <Letter key={`b${i}`} ch={ch} tone="muted" />)}
        {answer.split('').map((ch, i) => <Letter key={`f${i}`} ch={ch} tone="reveal" />)}
        {after.split('').map((ch, i) => <Letter key={`a${i}`} ch={ch} tone="muted" />)}
      </div>
      <div className="text-xl text-gray-300 mt-3">↓</div>
      <div className="mt-2 inline-block px-6 py-3 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-3xl tracking-[0.2em] animate-[bounce_0.7s_ease-out]">
        {word}
      </div>
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
    <div className="grid grid-cols-5 gap-2 mb-4">
      {problem.choices.map((choice) => (
        <button
          key={choice}
          onClick={() => handleSelect(choice)}
          disabled={disabled}
          className={`py-3 rounded-2xl text-base md:text-lg font-bold border-2 tracking-[0.15em] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-default ${
            value === choice
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
              : 'bg-white border-gray-200 text-gray-800 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          {choice}
        </button>
      ))}
    </div>
  )
}

function check(problem, value) {
  return value === problem.answer
}

function isComplete(value) {
  return typeof value === 'string' && value.length === 3
}

function key(problem) {
  return problem._key
}

function displayAnswer(problem) {
  return problem.answer
}

export default {
  id: 'wordGap',
  label: 'Word Gap',
  emoji: '🔤',
  color: 'from-emerald-400 to-teal-600',
  bgLight: 'bg-emerald-50',
  border: 'border-emerald-200',
  description: 'Fill the 3-letter gap to make a word',
  defaultInput: null,
  defaultCount: 10,
  group: 'verbal',
  generate,
  View,
  CorrectView,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
