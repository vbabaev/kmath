import { useState, useEffect, useRef } from 'react'
import { generateQuestion } from '../data/questions'

const TOTAL_QUESTIONS = 10
const POINTS_CORRECT = 10
const POINTS_STREAK_BONUS = 5

export default function Quiz({ topic, onFinish, onHome }) {
  const [current, setCurrent] = useState(() => generateQuestion(topic.id))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null
  const [questionNum, setQuestionNum] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [current])

  function normalizeAnswer(val) {
    return val.trim().replace(/\s+/g, '')
  }

  function checkAnswer() {
    if (!input.trim()) return
    const correct = normalizeAnswer(String(current.answer)) === normalizeAnswer(input)
    const newStreak = correct ? streak + 1 : 0
    const bonus = correct && newStreak > 1 ? POINTS_STREAK_BONUS : 0
    const earned = correct ? POINTS_CORRECT + bonus : 0

    setFeedback(correct ? 'correct' : 'wrong')
    setScore((s) => s + earned)
    setStreak(newStreak)
    setResults((r) => [...r, { question: current.question, answer: current.answer, userAnswer: input, correct }])

    setTimeout(() => {
      setFeedback(null)
      setInput('')
      if (questionNum >= TOTAL_QUESTIONS) {
        onFinish({ score: score + earned, streak: newStreak, results: [...results, { correct }] })
      } else {
        setQuestionNum((n) => n + 1)
        setCurrent(generateQuestion(topic.id))
      }
    }, 900)
  }

  function handleKey(e) {
    if (e.key === 'Enter') checkAnswer()
  }

  const progress = (questionNum - 1) / TOTAL_QUESTIONS

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
        <div className="bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <p className="text-center text-gray-400 text-sm mb-6">
          Question {questionNum} of {TOTAL_QUESTIONS} — {topic.label} {topic.emoji}
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
          <p className="text-2xl font-bold text-gray-800 mb-2">{current.question}</p>
          {feedback === 'correct' && <p className="text-green-600 font-semibold text-lg">✓ Correct! +{POINTS_CORRECT}{streak > 1 ? ` +${POINTS_STREAK_BONUS} bonus` : ''}</p>}
          {feedback === 'wrong' && <p className="text-red-600 font-semibold text-lg">✗ The answer was {current.answer}</p>}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={!!feedback}
          placeholder="Your answer…"
          className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-xl text-center focus:outline-none focus:border-indigo-400 mb-4 disabled:opacity-50"
        />

        <button
          onClick={checkAnswer}
          disabled={!!feedback || !input.trim()}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
        >
          Check Answer
        </button>
      </div>
    </div>
  )
}
