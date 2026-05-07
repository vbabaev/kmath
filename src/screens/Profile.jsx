import Heatmap from '../components/Heatmap'
import { getProfileColors } from '../profiles'

export default function Profile({ profile, onHome, onSwitch, onShop }) {
  const c = getProfileColors(profile.color)
  const sessions = profile.sessions ?? []
  const recent = [...sessions].reverse().slice(0, 5)
  const totalProblems = sessions.reduce((s, ses) => s + (ses.completed ?? 0), 0)

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onHome} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
            ← Home
          </button>
          <div className="flex items-center gap-4">
            <button onClick={onShop} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              🛍️ Shop
            </button>
            <button onClick={onSwitch} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              Switch profile
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <div
            className={`inline-flex w-24 h-24 rounded-2xl ${c.bgLight} ${c.border} border-2 items-center justify-center text-5xl mb-3 shadow-sm`}
          >
            {profile.emoji}
          </div>
          <h1 className={`text-3xl font-bold ${c.text}`}>{profile.name}</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md mb-4 border-2 border-gray-100 text-center">
          <div className="text-5xl font-bold text-indigo-600 mb-1">{profile.points ?? 0}</div>
          <div className="text-sm text-gray-500">Total Stars ⭐</div>
          <div className="text-xs text-gray-400 mt-2">
            {totalProblems} problem{totalProblems === 1 ? '' : 's'} over {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-md mb-4 border-2 border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Last 30 days</h3>
          <Heatmap sessions={sessions} />
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100" />
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-800" />
            <span>More</span>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {recent.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0"
                >
                  <div>
                    <div className="font-semibold text-gray-700 text-sm">{s.date}</div>
                    <div className="text-xs text-gray-400">
                      {s.completed} solved · {s.group}
                    </div>
                  </div>
                  <div className="text-indigo-600 font-bold text-sm">+{s.score} ⭐</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
