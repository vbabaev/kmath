function getRank(accuracy) {
  if (accuracy >= 90) return { label: 'Math Wizard! 🧙', color: 'text-purple-600' }
  if (accuracy >= 70) return { label: 'Star Student! ⭐', color: 'text-yellow-500' }
  if (accuracy >= 50) return { label: 'Good Job! 👍', color: 'text-blue-500' }
  return { label: 'Keep Practicing! 💪', color: 'text-orange-500' }
}

export default function Results({ result, onPlayAgain, onHome }) {
  const { score, totalAttempts, completedProblems } = result
  const total = completedProblems.length
  const firstTry = completedProblems.filter((p) => p.attempts === 1).length
  const accuracy = totalAttempts === 0 ? 100 : Math.round((total / totalAttempts) * 100)
  const rank = getRank(accuracy)

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
              <div className="text-sm text-gray-500 mt-1">Stars ⭐</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-sm text-gray-500 mt-1">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500">
                {total}/{totalAttempts}
              </div>
              <div className="text-sm text-gray-500 mt-1">Correct / Attempts</div>
            </div>
          </div>
          {firstTry < total && (
            <p className="mt-5 text-sm text-gray-400">
              {firstTry} of {total} solved on the first try
            </p>
          )}
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
