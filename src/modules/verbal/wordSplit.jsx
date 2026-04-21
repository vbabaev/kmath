import { useRef, useEffect } from 'react'
import {
  TARGETS,
  NONE_VALUE,
  canFormTargets,
  pickRandomPairForTarget,
  pickRandomNoPair,
} from './wordSplitData'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const isNone = Math.random() < 0.5

  if (!isNone) {
    for (let tries = 0; tries < 10; tries++) {
      const target = TARGETS[rand(0, TARGETS.length - 1)]
      const pair = pickRandomPairForTarget(target)
      if (!pair) continue
      const [w1, w2] = pair
      const validAnswers = canFormTargets(w1, w2)
      if (validAnswers.length === 0) continue
      return { w1, w2, validAnswers, isNone: false, _key: `ws:${w1}|${w2}` }
    }
  }

  const nonePair = pickRandomNoPair()
  if (nonePair) {
    const [w1, w2] = nonePair
    return { w1, w2, validAnswers: [], isNone: true, _key: `ws:${w1}|${w2}` }
  }

  const target = TARGETS[rand(0, TARGETS.length - 1)]
  const pair = pickRandomPairForTarget(target)
  const [w1, w2] = pair
  return { w1, w2, validAnswers: canFormTargets(w1, w2), isNone: false, _key: `ws:${w1}|${w2}` }
}

function View({ problem }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="text-3xl font-bold text-gray-800 tracking-wider">{problem.w1}</span>
        <span className="text-2xl text-fuchsia-400 font-bold">+</span>
        <span className="text-3xl font-bold text-gray-800 tracking-wider">{problem.w2}</span>
      </div>
      <p className="mt-4 text-sm text-gray-500 leading-relaxed">
        Can you make a 4-letter word from the <span className="font-semibold text-gray-700">end</span> of the first word
        {' '}+ the <span className="font-semibold text-gray-700">beginning</span> of the second?
      </p>
    </div>
  )
}

function splitLetters(w1, w2, target) {
  for (let k = 1; k <= 3; k++) {
    if (w1.slice(-k) + w2.slice(0, 4 - k) === target) return k
  }
  return null
}

function CorrectView({ problem, input }) {
  if (problem.isNone) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-3xl font-bold text-gray-400 tracking-wider">{problem.w1}</span>
          <span className="text-2xl text-gray-300 font-bold">+</span>
          <span className="text-3xl font-bold text-gray-400 tracking-wider">{problem.w2}</span>
        </div>
        <div className="mt-5 inline-block px-5 py-2.5 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-xl animate-[pulse_0.8s_ease-out]">
          ✓ No 4-letter word
        </div>
      </div>
    )
  }

  const target =
    typeof input === 'string' && problem.validAnswers.includes(input.toUpperCase())
      ? input.toUpperCase()
      : problem.validAnswers[0]
  const k = splitLetters(problem.w1, problem.w2, target) ?? 1
  const w1Cut = problem.w1.length - k

  return (
    <div className="py-2">
      <div className="flex items-center justify-center gap-3 flex-wrap text-3xl font-bold tracking-wider">
        <span>
          {problem.w1.split('').map((ch, i) => (
            <span key={i} className={i >= w1Cut ? 'text-green-600' : 'text-gray-300'}>
              {ch}
            </span>
          ))}
        </span>
        <span className="text-2xl text-gray-300">+</span>
        <span>
          {problem.w2.split('').map((ch, i) => (
            <span key={i} className={i < 4 - k ? 'text-green-600' : 'text-gray-300'}>
              {ch}
            </span>
          ))}
        </span>
      </div>
      <div className="text-xl text-gray-300 mt-3">↓</div>
      <div className="mt-2 inline-block px-6 py-3 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-4xl tracking-[0.25em] animate-[bounce_0.7s_ease-out]">
        {target}
      </div>
    </div>
  )
}

function Input({ value, onChange, onSubmit, disabled }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  function handleChange(e) {
    const up = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
    onChange(up)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value && value.length === 4 && !disabled) {
      onSubmit(value)
    }
  }

  function handleCheck() {
    if (disabled || !value || value.length !== 4) return
    onSubmit(value)
  }

  function handleNoWord() {
    if (disabled) return
    onChange(NONE_VALUE)
    onSubmit(NONE_VALUE)
  }

  const showingNone = value === NONE_VALUE
  const typed = showingNone ? '' : (value ?? '')

  return (
    <div className="space-y-3 mb-4">
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="4-letter word…"
        maxLength={4}
        className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl text-center tracking-[0.3em] font-bold uppercase focus:outline-none focus:border-fuchsia-400 disabled:opacity-50"
      />
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCheck}
          disabled={disabled || typed.length !== 4}
          className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-fuchsia-600 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          Check Word
        </button>
        <button
          onClick={handleNoWord}
          disabled={disabled}
          className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-lg hover:border-fuchsia-300 hover:bg-fuchsia-50 active:scale-95 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          No word
        </button>
      </div>
    </div>
  )
}

function check(problem, value) {
  if (value === NONE_VALUE) return problem.isNone
  if (typeof value !== 'string') return false
  const up = value.toUpperCase()
  return problem.validAnswers.includes(up)
}

function isComplete(value) {
  if (value === NONE_VALUE) return true
  return typeof value === 'string' && value.length === 4
}

function key(problem) {
  return problem._key
}

function displayAnswer(problem) {
  if (problem.isNone) return 'No word'
  return problem.validAnswers.join(' / ')
}

export default {
  id: 'wordSplit',
  label: 'Word Split',
  emoji: '🧩',
  color: 'from-fuchsia-400 to-fuchsia-600',
  bgLight: 'bg-fuchsia-50',
  border: 'border-fuchsia-200',
  description: 'Find a 4-letter word from two others',
  defaultInput: '',
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
