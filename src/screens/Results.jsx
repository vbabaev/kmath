import { useEffect } from 'react'
import { useFinn } from '../finn/FinnContext'

function getRank(accuracy) {
  if (accuracy >= 90) return { label: 'Math Wizard! 🧙', color: 'text-purple-600' }
  if (accuracy >= 70) return { label: 'Star Student! ⭐', color: 'text-yellow-500' }
  if (accuracy >= 50) return { label: 'Good Job! 👍', color: 'text-blue-500' }
  return { label: 'Keep Practicing! 💪', color: 'text-orange-500' }
}

export function fmtTime(ms) {
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function buildModuleStats(completedProblems) {
  const map = {}
  for (const { module, attempts, timeMs } of completedProblems) {
    if (!map[module.id]) {
      map[module.id] = { module, solved: 0, firstTry: 0, totalAttempts: 0, totalMs: 0 }
    }
    const s = map[module.id]
    s.solved++
    s.totalAttempts += attempts
    s.totalMs += timeMs
    if (attempts === 1) s.firstTry++
  }
  // Sort slowest avg time first — those need the most practice
  return Object.values(map).sort((a, b) => (b.totalMs / b.solved) - (a.totalMs / a.solved))
}

// Pure-presentational results body — used by Results screen AND by the
// History detail page when replaying a past session.
export function ResultsBreakdown({ result }) {
  const { score, totalAttempts, completedProblems, initialCount } = result
  const total = completedProblems.length
  const firstTry = completedProblems.filter((p) => p.attempts === 1).length
  const accuracy = totalAttempts === 0 ? 100 : Math.round((total / totalAttempts) * 100)
  const rank = getRank(accuracy)
  const totalMs = completedProblems.reduce((sum, p) => sum + p.timeMs, 0)
  const retryCount = total - initialCount

  const moduleStats = buildModuleStats(completedProblems)
  const multipleModules = moduleStats.length > 1

  return (
    <>
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Session Complete!</h2>
      <p className={`text-xl font-semibold mb-6 ${rank.color}`}>{rank.label}</p>

      {/* Global stats */}
      <div className="bg-white rounded-3xl p-6 shadow-md mb-4 border-2 border-gray-100">
        <div className="flex justify-around mb-4">
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
            <div className="text-sm text-gray-500 mt-1">Correct / Tries</div>
          </div>
        </div>
        <div className="flex justify-around text-sm text-gray-500 border-t border-gray-100 pt-3">
          <span>First try: <strong className="text-gray-700">{firstTry}/{total}</strong></span>
          {retryCount > 0 && <span>Retried: <strong className="text-orange-500">{retryCount}</strong></span>}
          <span>Total time: <strong className="text-gray-700">{fmtTime(totalMs)}</strong></span>
        </div>
      </div>

      {/* Per-module breakdown (only when more than one module) */}
      {multipleModules && (
        <div className="bg-white rounded-3xl p-5 shadow-md mb-4 border-2 border-gray-100 text-left">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">By Topic</h3>
          <div className="space-y-2">
            {moduleStats.map(({ module, solved, totalAttempts: ta, totalMs: ms }) => {
              const acc = Math.round((solved / ta) * 100)
              const avgMs = ms / solved
              return (
                <div key={module.id} className={`${module.bgLight} ${module.border} border rounded-2xl px-4 py-3 flex items-center justify-between`}>
                  <span className="font-semibold text-gray-800 text-sm">
                    {module.emoji} {module.label}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={acc === 100 ? 'text-green-600 font-bold' : acc >= 70 ? 'text-yellow-600 font-semibold' : 'text-red-500 font-semibold'}>
                      {acc}%
                    </span>
                    <span className="text-gray-500">⏱ {fmtTime(avgMs)}/q</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Single-module detail */}
      {!multipleModules && moduleStats.length === 1 && (
        <div className="text-sm text-gray-400 mb-4">
          Avg time per question: <strong className="text-gray-600">{fmtTime(moduleStats[0].totalMs / moduleStats[0].solved)}</strong>
        </div>
      )}
    </>
  )
}

export default function Results({ result, profileName, onPlayAgain, onHome }) {
  // Finn drops a motivational line when the kid lands on Results.
  const { say } = useFinn()
  useEffect(() => {
    say('finish', { name: profileName })
  }, [say, profileName])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <ResultsBreakdown result={result} />

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
