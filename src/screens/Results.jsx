const MAX_SCORE = 10 * 10 // 10 questions × 10 pts

function getRank(score) {
  const pct = score / MAX_SCORE
  if (pct >= 0.9) return { label: 'Math Wizard! 🧙', color: 'text-purple-600' }
  if (pct >= 0.7) return { label: 'Star Student! ⭐', color: 'text-yellow-500' }
  if (pct >= 0.5) return { label: 'Good Job! 👍', color: 'text-blue-500' }
  return { label: 'Keep Practicing! 💪', color: 'text-orange-500' }
}

export default function Results({ result, topic, onPlayAgain, onHome }) {
  const { score, results } = result
  const correct = results.filter((r) => r.correct).length
  const rank = getRank(score)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Session Complete!</h2>
        <p className={`text-xl font-semibold mb-6 ${rank.color}`}>{rank.label}</p>

        <div className="bg-white rounded-3xl p-8 shadow-md mb-6 border-2 border-gray-100">
          <div className="flex justify-around">
            <div>
              <div className="text-4xl font-bold text-indigo-600">{score}</div>
              <div className="text-sm text-gray-500 mt-1">Total Stars ⭐</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{correct}</div>
              <div className="text-sm text-gray-500 mt-1">Correct ✓</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500">{results.length - correct}</div>
              <div className="text-sm text-gray-500 mt-1">Missed ✗</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={onHome}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-lg hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
