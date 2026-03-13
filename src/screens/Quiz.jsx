import { useState, useEffect, useRef } from 'react'

const POINTS_CORRECT = 10
const POINTS_STREAK_BONUS = 5

function defaultIsComplete(value) {
  return typeof value === 'string' ? value.trim() !== '' : false
}

export default function Quiz({ problems, onFinish, onHome }) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState(() => problems[0].module.defaultInput ?? '')
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  const { module, problem } = problems[index]

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  function submit() {
    const isComplete = module.isComplete ?? defaultIsComplete
    if (!isComplete(input) || feedback) return

    const correct = module.check(problem, input)
    const newStreak = correct ? streak + 1 : 0
    const bonus = correct && newStreak > 1 ? POINTS_STREAK_BONUS : 0
    const earned = correct ? POINTS_CORRECT + bonus : 0
    const newScore = score + earned
    const newResults = [...results, { correct, earned, module }]

    setFeedback(correct ? 'correct' : 'wrong')
    setScore(newScore)
    setStreak(newStreak)
    setResults(newResults)

    setTimeout(() => {
      const next = index + 1
      setFeedback(null)
      setInput(problems[next]?.module.defaultInput ?? '')
      if (next >= problems.length) {
        onFinish({ score: newScore, streak: newStreak, results: newResults })
      } else {
        setIndex(next)
      }
    }, 900)
  }

  const isComplete = module.isComplete ?? defaultIsComplete
  const progress = index / problems.length

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onHome} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">
            ← Home
          </button>
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <span className="text-orange-500 font-bold text-sm">🔥 {streak} streak!</span>
            )}
            <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm">
              ⭐ {score}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-center text-gray-400 text-sm mb-6">
          {index + 1} / {problems.length} — {module.label} {module.emoji}
        </p>

        {/* Question card */}
        <div
          className={`rounded-3xl p-8 text-center mb-6 shadow-md transition-colors duration-300 ${
            feedback === 'correct'
              ? 'bg-green-100 border-2 border-green-400'
              : feedback === 'wrong'
              ? 'bg-red-100 border-2 border-red-400'
              : 'bg-white border-2 border-gray-100'
          }`}
        >
          <module.View problem={problem} />
          {feedback === 'correct' && (
            <p className="mt-4 text-green-600 font-semibold text-lg">
              ✓ Correct! +{POINTS_CORRECT}{streak > 1 ? ` +${POINTS_STREAK_BONUS} bonus` : ''}
            </p>
          )}
          {feedback === 'wrong' && (
            <p className="mt-4 text-red-600 font-semibold text-lg">
              ✗ Answer: {problem.answerDen === 1 ? problem.answerNum : `${problem.answerNum}/${problem.answerDen}`}{problem.answer !== undefined ? problem.answer : ''}
            </p>
          )}
        </div>

        {/* Input — custom per module or default text */}
        {module.Input ? (
          <module.Input
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={!!feedback}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={!!feedback}
            placeholder={module.inputHint ?? 'Your answer…'}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-xl text-center focus:outline-none focus:border-indigo-400 mb-4 disabled:opacity-50"
          />
        )}

        <button
          onClick={submit}
          disabled={!!feedback || !isComplete(input)}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
        >
          Check Answer
        </button>
      </div>
    </div>
  )
}
