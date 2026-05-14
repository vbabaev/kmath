import { ResultsBreakdown, fmtTime } from './Results'
import MoodBadge from '../components/MoodBadge'
import { getModule } from '../modules'

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// Rebuilds the live `{ module, problem, attempts, timeMs }` shape from
// the persisted `session.problems` array. Missing modules (e.g. if a
// module was removed in code) are filtered out.
function hydrateSessionProblems(session) {
  const list = session?.problems ?? []
  return list
    .map((p) => {
      const module = getModule(p.moduleId)
      if (!module) return null
      return { module, problem: p.problem, attempts: p.attempts, timeMs: p.timeMs }
    })
    .filter(Boolean)
}

export default function SessionDetail({ profile, sessionIdx, onBack }) {
  const sessions = profile.sessions ?? []
  const session = sessions[sessionIdx]
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center p-6">
        <div className="max-w-lg w-full">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-4">
            ← Back
          </button>
          <div className="bg-white rounded-3xl p-6 shadow-md text-center text-gray-400">
            Session not found.
          </div>
        </div>
      </div>
    )
  }

  const replay = hydrateSessionProblems(session)
  const canReplay = replay.length > 0
  // Reconstruct the Results-screen shape from the stored session entry.
  const result = canReplay
    ? {
        score: session.score ?? 0,
        totalAttempts: session.totalAttempts ?? 0,
        initialCount: session.initialCount ?? replay.length,
        completedProblems: replay,
      }
    : null

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
            ← Back
          </button>
          <span className="text-xs text-gray-400">{fmtDate(session.startedAt)}</span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800">
              {session.isAssignment ? '📚 Assignment' : 'Practice session'}
            </h2>
            <span className="text-xs text-gray-500">{session.group}</span>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            Duration: <span className="font-semibold text-gray-700">{fmtTime(session.durationMs ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              <div className="mb-1">Mood before</div>
              <MoodBadge mood={session.moodStart} />
            </div>
            <span className="text-gray-300 text-2xl">→</span>
            <div className="text-xs text-gray-500 text-right">
              <div className="mb-1">Mood after</div>
              <MoodBadge mood={session.moodEnd} />
            </div>
          </div>
        </div>

        <div className="text-center">
          {result ? (
            <ResultsBreakdown result={result} />
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-100 text-center text-gray-500">
              <div className="text-4xl mb-2">📜</div>
              <div className="font-semibold text-gray-700 mb-1">No replay available</div>
              <div className="text-xs text-gray-400">
                This session was completed before per-problem history was added.
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Score: <strong>{session.score}</strong> · Solved: <strong>{session.completed}</strong> / {session.totalAttempts}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
