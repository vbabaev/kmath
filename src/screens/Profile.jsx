import { useEffect, useState } from 'react'
import Heatmap from '../components/Heatmap'
import { getProfileColors } from '../profiles'
import { getMyGroup } from '../groups'

const ROLE_LABEL = { owner: 'Owner', parent: 'Parent', child: 'Child' }

function HouseholdMembers({ profile }) {
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getMyGroup()
      .then((g) => { if (!cancelled) setGroup(g) })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'Failed to load household') })
    return () => { cancelled = true }
  }, [])

  if (error) return null
  if (!group) return null

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md mb-4 border-2 border-gray-100">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        {group.name}
      </h3>
      <div className="space-y-2">
        {group.members.map((m) => {
          const colors = getProfileColors(m.color)
          const isSelf = m.id === profile.id
          return (
            <div key={m.id} className={`flex items-center gap-3 ${colors.bgLight} ${colors.border} border rounded-2xl px-3 py-2`}>
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${colors.text} truncate`}>
                  {m.name}{isSelf && <span className="text-xs font-normal text-gray-400"> (you)</span>}
                </div>
                {m.googleEmail && (
                  <div className="text-xs text-gray-500 truncate font-mono">{m.googleEmail}</div>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {ROLE_LABEL[m.role] ?? m.role}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmailManager({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(profile.googleEmail ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save(next) {
    setBusy(true)
    setError(null)
    try {
      await onSave(next)
      setEditing(false)
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md mb-4 border-2 border-gray-100">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Sign-in email</h3>
      {!editing && (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-sm">
            {profile.googleEmail
              ? <span className="font-mono text-gray-800">{profile.googleEmail}</span>
              : <span className="text-gray-400 italic">No email set — only an adult in the household can access this profile</span>}
          </div>
          <button
            onClick={() => { setValue(profile.googleEmail ?? ''); setEditing(true); setError(null) }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            {profile.googleEmail ? 'Change' : 'Set'}
          </button>
          {profile.googleEmail && (
            <button
              onClick={() => save(null)}
              disabled={busy}
              className="text-sm font-semibold text-gray-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      )}
      {editing && (
        <div>
          <input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="kira@example.com"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-3 focus:outline-none focus:border-indigo-400"
          />
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setError(null) }}
              disabled={busy}
              className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => save(value.trim() ? value.trim().toLowerCase() : null)}
              disabled={busy}
              className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Profile({ profile, canSwitch = false, canManageEmail = false, showHousehold = false, onHome, onSwitch, onShop, onLogout, onSetEmail }) {
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
            {canSwitch && (
              <button onClick={onSwitch} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                Switch profile
              </button>
            )}
            {onLogout && (
              <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                Logout
              </button>
            )}
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

        {canManageEmail && (
          <EmailManager profile={profile} onSave={onSetEmail} />
        )}

        {showHousehold && <HouseholdMembers profile={profile} />}

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
