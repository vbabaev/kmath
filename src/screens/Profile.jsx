import { useEffect, useMemo, useState } from 'react'
import Heatmap from '../components/Heatmap'
import MoodBadge from '../components/MoodBadge'
import { getProfileColors, localDateYMD } from '../profiles'
import { getMyGroup } from '../groups'
import { getModule } from '../modules'

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

function fmtTime(ms) {
  if (ms == null) return '–'
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

// Recent-mood strip — last N moods (newest right), tinted via MoodBadge.
function MoodTrend({ sessions, limit = 10 }) {
  const withMood = sessions
    .map((s, i) => ({ idx: i, moodStart: s.moodStart, moodEnd: s.moodEnd, date: s.date }))
    .filter((s) => s.moodStart || s.moodEnd)
    .slice(-limit)
  if (withMood.length === 0) return null
  return (
    <div className="bg-white rounded-3xl p-5 shadow-md mb-4 border-2 border-gray-100">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Mood trend</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {withMood.map((m) => (
          <div key={m.idx} className="flex items-center gap-1">
            <MoodBadge mood={m.moodStart} />
            <span className="text-gray-300 text-xs">→</span>
            <MoodBadge mood={m.moodEnd} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Aggregates from the session history.
function computeStats(sessions) {
  // Per-module roll-up. Each session may have `problems` (new shape) or
  // only `modules` (legacy). When `problems` is present we get
  // fastest-solve too; legacy sessions only contribute to totals.
  const byModule = new Map()
  function ensureMod(id, label) {
    if (!byModule.has(id)) {
      byModule.set(id, {
        id, label,
        solved: 0, attempts: 0, totalMs: 0,
        fastestMs: Infinity, stars: 0,
      })
    }
    return byModule.get(id)
  }

  let assignmentsCompleted = 0
  // Per-day star totals for "best streak day".
  const starsByDate = new Map()

  for (const s of sessions) {
    if (s.isAssignment) assignmentsCompleted++
    starsByDate.set(s.date, (starsByDate.get(s.date) ?? 0) + (s.score ?? 0))

    // Session-level module summary (always present).
    for (const m of s.modules ?? []) {
      const agg = ensureMod(m.id, m.label)
      agg.solved += m.solved ?? 0
      agg.attempts += m.attempted ?? 0
      agg.totalMs += (m.avgTimeMs ?? 0) * (m.solved ?? 0)
    }

    // Per-problem detail (new shape) — gives us fastest + stars/module.
    for (const p of s.problems ?? []) {
      const mod = getModule(p.moduleId)
      const label = mod?.label ?? p.moduleId
      const agg = ensureMod(p.moduleId, label)
      if (p.timeMs < agg.fastestMs) agg.fastestMs = p.timeMs
      // Stars: +10 first try, +5 bonus on streak≥2. We don't have
      // streak context per-problem, so credit just the base correct
      // points on first try. Close enough for an at-a-glance view.
      if (p.attempts === 1) agg.stars += 10
    }
  }

  const moduleRows = Array.from(byModule.values())
    .filter((m) => m.solved > 0)
    .map((m) => ({
      ...m,
      accuracy: m.attempts > 0 ? Math.round((m.solved / m.attempts) * 100) : 0,
      avgMs: m.solved > 0 ? Math.round(m.totalMs / m.solved) : 0,
      fastestMs: Number.isFinite(m.fastestMs) ? m.fastestMs : null,
    }))
    .sort((a, b) => b.solved - a.solved)

  const mostPlayed = moduleRows[0] ?? null
  const totalSolved = moduleRows.reduce((sum, m) => sum + m.solved, 0)

  // Best day = max stars on any single date in the history.
  let bestDay = null
  for (const [date, stars] of starsByDate.entries()) {
    if (!bestDay || stars > bestDay.stars) bestDay = { date, stars }
  }

  // Recent 7-day pace — sessions completed in the last 7 local days.
  const today = new Date()
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  const cutoffKey = localDateYMD(cutoff)
  const lastWeekSessions = sessions.filter((s) => s.date >= cutoffKey).length

  return {
    moduleRows,
    mostPlayed,
    assignmentsCompleted,
    bestDay,
    totalSolved,
    lastWeekSessions,
  }
}

function StatsSection({ sessions }) {
  const stats = useMemo(() => computeStats(sessions), [sessions])
  if (sessions.length === 0) return null

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md mb-4 border-2 border-gray-100">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">All-time stats</h3>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3">
          <div className="text-xs text-gray-500">Total solved</div>
          <div className="text-xl font-bold text-indigo-700">{stats.totalSolved}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <div className="text-xs text-gray-500">Assignments done</div>
          <div className="text-xl font-bold text-amber-700">{stats.assignmentsCompleted}</div>
        </div>
        {stats.mostPlayed && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3">
            <div className="text-xs text-gray-500">Most played</div>
            <div className="text-sm font-bold text-violet-700 truncate">{stats.mostPlayed.label}</div>
            <div className="text-xs text-gray-500">{stats.mostPlayed.solved} solved</div>
          </div>
        )}
        {stats.bestDay && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
            <div className="text-xs text-gray-500">Best day</div>
            <div className="text-sm font-bold text-emerald-700 truncate">{stats.bestDay.date}</div>
            <div className="text-xs text-gray-500">+{stats.bestDay.stars} ⭐</div>
          </div>
        )}
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-3 col-span-2">
          <div className="text-xs text-gray-500">Last 7 days</div>
          <div className="text-sm font-bold text-pink-700">
            {stats.lastWeekSessions} session{stats.lastWeekSessions === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Per-module table */}
      {stats.moduleRows.length > 0 && (
        <div className="space-y-2">
          {stats.moduleRows.map((m) => {
            const mod = getModule(m.id)
            const emoji = mod?.emoji ?? '📘'
            return (
              <div key={m.id} className={`${mod?.bgLight ?? 'bg-gray-50'} ${mod?.border ?? 'border-gray-200'} border rounded-2xl px-3 py-2 text-sm`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">{emoji} {m.label}</span>
                  <span className="text-xs text-gray-500">{m.solved} solved</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>Accuracy: <strong className={m.accuracy >= 90 ? 'text-green-600' : m.accuracy >= 70 ? 'text-yellow-600' : 'text-red-500'}>{m.accuracy}%</strong></span>
                  <span>Avg: <strong className="text-gray-700">{fmtTime(m.avgMs)}</strong></span>
                  {m.fastestMs != null && <span>Fastest: <strong className="text-gray-700">{fmtTime(m.fastestMs)}</strong></span>}
                  <span>Earned: <strong className="text-indigo-700">+{m.stars} ⭐</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HistorySection({ sessions, onViewSession }) {
  const [tab, setTab] = useState('assignments')

  // Newest first. Track each row's original index in `sessions` so the
  // detail page can look it up; we never mutate the underlying array.
  const indexedNewestFirst = useMemo(
    () => sessions.map((s, idx) => ({ s, idx })).reverse(),
    [sessions],
  )
  const assignments = useMemo(
    () => indexedNewestFirst.filter(({ s }) => s.isAssignment),
    [indexedNewestFirst],
  )
  const rows = tab === 'assignments' ? assignments : indexedNewestFirst

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md mb-4 border-2 border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">History</h3>
        <div className="flex bg-gray-100 rounded-full p-0.5 text-xs font-semibold">
          <button
            onClick={() => setTab('assignments')}
            className={`px-3 py-1 rounded-full transition-colors ${tab === 'assignments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'} cursor-pointer`}
          >
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1 rounded-full transition-colors ${tab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'} cursor-pointer`}
          >
            All ({sessions.length})
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-6">
          {tab === 'assignments' ? 'No assignments yet.' : 'No sessions yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(({ s, idx }) => {
            return (
              <button
                key={idx}
                onClick={() => onViewSession(idx)}
                className="w-full text-left flex items-center justify-between gap-3 border-b border-gray-50 last:border-0 pb-2 last:pb-0 hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                    {s.isAssignment && <span title="Assignment">📚</span>}
                    <span>{s.date}</span>
                    <span className="text-xs font-normal text-gray-400">{s.group}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap mt-0.5">
                    <span>{s.completed} solved</span>
                    {s.totalAttempts != null && <span>· {s.totalAttempts} tries</span>}
                    {(s.moodStart || s.moodEnd) && (
                      <span className="inline-flex items-center gap-1">
                        <MoodBadge mood={s.moodStart} />
                        <span className="text-gray-300">→</span>
                        <MoodBadge mood={s.moodEnd} />
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-indigo-600 font-bold text-sm shrink-0">+{s.score} ⭐</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Profile({ profile, canSwitch = false, canManageEmail = false, showHousehold = false, onHome, onSwitch, onShop, onLogout, onSetEmail, onViewSession }) {
  const c = getProfileColors(profile.color)
  const sessions = profile.sessions ?? []
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

        <MoodTrend sessions={sessions} />

        <StatsSection sessions={sessions} />

        <HistorySection sessions={sessions} onViewSession={onViewSession ?? (() => {})} />
      </div>
    </div>
  )
}
