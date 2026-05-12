import { useState } from 'react'
import { getProfileColors, COLOR_CHOICES, EMOJI_CHOICES } from '../profiles'

// canInviteParent gates whether the "parent" role option appears.
// Only the household owner can promote another adult.
function CreateProfileModal({ onCreate, onCancel, canInviteParent = false }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('child')
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0])
  const [color, setColor] = useState('indigo')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onCreate({
        name: name.trim(),
        emoji,
        color,
        role,
        googleEmail: email.trim() ? email.trim().toLowerCase() : null,
      })
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to create')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">New profile</h2>

        <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kira"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-4 focus:outline-none focus:border-indigo-400"
        />

        <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
        <div className="flex gap-2 mb-4">
          {(canInviteParent ? ['child', 'parent'] : ['child']).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
                role === r
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r === 'child' ? 'Child' : 'Parent'}
            </button>
          ))}
        </div>

        <label className="block text-sm font-semibold text-gray-600 mb-1">Emoji</label>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-2xl w-full aspect-square rounded-xl border-2 cursor-pointer transition-all ${
                emoji === e ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="block text-sm font-semibold text-gray-600 mb-1">Color</label>
        <div className="flex gap-2 mb-4">
          {COLOR_CHOICES.map((c) => {
            const colors = getProfileColors(c)
            return (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full ${colors.swatch} cursor-pointer transition-all ${
                  color === c ? 'ring-4 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-105'
                }`}
                aria-label={c}
              />
            )
          })}
        </div>

        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Sign-in email <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kira@example.com"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-4 focus:outline-none focus:border-indigo-400"
        />
        <p className="text-xs text-gray-400 -mt-3 mb-4">
          Only the matching Google account can sign in as this profile. You can set or change this later.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2 mb-3">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePicker({ profiles, onSelect, onLogout, onCreate, canCreate = false, canInviteParent = false }) {
  const [creating, setCreating] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {onLogout && (
        <button
          onClick={onLogout}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Logout
        </button>
      )}
      <div className="text-center mb-12">
        <div className="text-5xl mb-3">🧮</div>
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">
          {profiles.length === 0 ? 'Welcome!' : "Who's playing?"}
        </h1>
        <p className="text-gray-400">
          {profiles.length === 0
            ? canCreate ? 'Create your first profile to get started' : 'No profiles yet — ask a parent to add you'
            : 'Pick your profile'}
        </p>
      </div>
      <div className="flex gap-6 flex-wrap justify-center">
        {profiles.map((p) => {
          const c = getProfileColors(p.color)
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="group flex flex-col items-center gap-3 cursor-pointer"
            >
              <div
                className={`w-24 h-24 rounded-2xl ${c.bgLight} ${c.border} border-2 flex items-center justify-center text-5xl group-hover:scale-105 group-active:scale-95 transition-transform shadow-sm`}
              >
                {p.emoji}
              </div>
              <div className={`font-semibold ${c.text}`}>{p.name}</div>
            </button>
          )
        })}
        {canCreate && (
          <button
            onClick={() => setCreating(true)}
            className="group flex flex-col items-center gap-3 cursor-pointer"
          >
            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-4xl text-gray-400 group-hover:bg-gray-50 group-hover:scale-105 group-active:scale-95 transition-all">
              +
            </div>
            <div className="font-semibold text-gray-500">New profile</div>
          </button>
        )}
      </div>

      {creating && (
        <CreateProfileModal
          canInviteParent={canInviteParent}
          onCancel={() => setCreating(false)}
          onCreate={async (data) => {
            await onCreate(data)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}
