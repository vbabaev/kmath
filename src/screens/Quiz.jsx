import { useState, useEffect, useRef } from 'react'
import { saveActiveQuiz } from '../profiles'
import { toProblemRef } from '../modules'
import ProfileButton from '../components/ProfileButton'

const POINTS_CORRECT = 10
const POINTS_STREAK_BONUS = 5
const PENALTY_PER_UNSOLVED = 5

function defaultIsComplete(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export default function Quiz({ problems, activeProfile, initialState, isAssignment = false, onFinish, onCancel, onProfileClick }) {
  const startQueue = initialState?.queue ?? problems
  const startIndex = initialState?.index ?? 0

  // queue can grow as failed problems are re-appended; ref keeps closures fresh
  const [queue, setQueue] = useState(startQueue)
  const queueRef = useRef(startQueue)

  const [index, setIndex] = useState(startIndex)
  const [input, setInput] = useState(() => startQueue[startIndex]?.module.defaultInput ?? '')
  const [feedback, setFeedback] = useState(null)       // 'correct' | 'wrong' | null
  const [score, setScore] = useState(initialState?.score ?? 0)
  const [streak, setStreak] = useState(initialState?.streak ?? 0)
  const [problemAttempts, setProblemAttempts] = useState(initialState?.problemAttempts ?? 0)
  const [totalAttempts, setTotalAttempts] = useState(initialState?.totalAttempts ?? 0)
  const [completedProblems, setCompletedProblems] = useState(initialState?.completedProblems ?? [])
  const [showCancel, setShowCancel] = useState(false)
  const inputRef = useRef(null)
  const questionStart = useRef(Date.now())

  const { module, problem } = queue[index]
  const isComplete = module.isComplete ?? defaultIsComplete

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  // Auto-save for F5 / tab-close recovery. Fires whenever persisted state
  // changes (once per submit, effectively).
  useEffect(() => {
    saveActiveQuiz({
      problems: problems.map(toProblemRef),
      queue: queue.map(toProblemRef),
      index,
      score,
      streak,
      problemAttempts,
      totalAttempts,
      completedProblems: completedProblems.map((c) => ({
        moduleId: c.module.id,
        attempts: c.attempts,
        timeMs: c.timeMs,
      })),
      isAssignment,
    })
  }, [problems, queue, index, score, streak, problemAttempts, totalAttempts, completedProblems, isAssignment])

  function appendToQueue(item) {
    const next = [...queueRef.current, item]
    queueRef.current = next
    setQueue(next)
  }

  function submit(directValue) {
    const currentInput = directValue !== undefined ? directValue : input
    if (!isComplete(currentInput, problem) || feedback) return

    const newProblemAttempts = problemAttempts + 1
    const newTotalAttempts = totalAttempts + 1
    const correct = module.check(problem, currentInput)

    setProblemAttempts(newProblemAttempts)
    setTotalAttempts(newTotalAttempts)

    if (!correct) {
      setStreak(0)
      setFeedback('wrong')
      appendToQueue({ module, problem: module.generate() })
      setTimeout(() => {
        setFeedback(null)
        setInput(module.defaultInput ?? '')
      }, 900)
      return
    }

    const timeMs = Date.now() - questionStart.current
    const firstTry = newProblemAttempts === 1
    const newStreak = firstTry ? streak + 1 : 0
    const bonus = firstTry && newStreak > 1 ? POINTS_STREAK_BONUS : 0
    const earned = firstTry ? POINTS_CORRECT + bonus : 0
    const newScore = score + earned
    const newCompleted = [...completedProblems, { module, attempts: newProblemAttempts, timeMs }]

    setFeedback('correct')
    setScore(newScore)
    setStreak(newStreak)
    setCompletedProblems(newCompleted)

    setTimeout(() => {
      const next = index + 1
      const currentQueue = queueRef.current
      setFeedback(null)
      setProblemAttempts(0)
      questionStart.current = Date.now()
      setInput(currentQueue[next]?.module.defaultInput ?? '')
      if (next >= currentQueue.length) {
        onFinish({ score: newScore, totalAttempts: newTotalAttempts, completedProblems: newCompleted, initialCount: problems.length })
      } else {
        setIndex(next)
      }
    }, 900)
  }

  const retryCount = queue.length - problems.length
  const progress = index / queue.length
  const firstTry = problemAttempts === 0
  const unsolved = problems.length - completedProblems.length
  const penalty = Math.max(0, unsolved) * PENALTY_PER_UNSOLVED

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Top bar — profile access (works during assignments too) */}
        {activeProfile && onProfileClick && (
          <div className="flex justify-end mb-3">
            <ProfileButton profile={activeProfile} onClick={onProfileClick} />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {isAssignment ? (
            <span className="text-amber-700 bg-amber-100 border border-amber-300 font-semibold text-xs px-3 py-1 rounded-full">
              📚 Assignment
            </span>
          ) : (
            <button
              onClick={() => setShowCancel(true)}
              className="text-gray-400 hover:text-red-500 text-sm cursor-pointer"
            >
              ✕ Cancel
            </button>
          )}
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
          {index + 1} / {queue.length}
          {retryCount > 0 && <span className="text-orange-400"> (+{retryCount} retry)</span>}
          {' '}— {module.label} {module.emoji}
          {problemAttempts > 0 && (
            <span className="ml-2 text-red-400">({problemAttempts} {problemAttempts === 1 ? 'attempt' : 'attempts'})</span>
          )}
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
          {feedback === 'correct' && module.CorrectView ? (
            <module.CorrectView problem={problem} input={input} />
          ) : (
            <module.View problem={problem} />
          )}
          {feedback === 'correct' && (
            <p className="mt-4 text-green-600 font-semibold text-lg">
              {firstTry
                ? `✓ Correct! +${POINTS_CORRECT}${streak > 1 ? ` +${POINTS_STREAK_BONUS} bonus` : ''}`
                : '✓ Correct!'}
            </p>
          )}
          {feedback === 'wrong' && (
            <p className="mt-4 text-red-600 font-semibold text-lg">
              ✗ Not quite — try again!
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
            problem={problem}
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

        {!module.Input && (
          <button
            onClick={() => submit()}
            disabled={!!feedback || !isComplete(input, problem)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            Check Answer
          </button>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-3 text-gray-800">Cancel this quiz?</h3>
            <p className="text-gray-700 mb-2">
              You have <span className="font-bold">{Math.max(0, unsolved)}</span>{' '}
              {unsolved === 1 ? 'problem' : 'problems'} left to solve.
            </p>
            <p className="text-gray-700 mb-5">
              If you cancel now, your progress will be lost and{' '}
              <span className="font-bold text-red-600">−{penalty} ⭐</span>{' '}
              will be taken from your stars (5 per unsolved problem).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 cursor-pointer"
              >
                Keep playing
              </button>
              <button
                onClick={() => {
                  setShowCancel(false)
                  onCancel(penalty)
                }}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 cursor-pointer"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
