import { getProfileColors } from '../profiles'

const ROLE_LABELS = { owner: 'owner', parent: 'parent', child: null }

export default function ProfileButton({ profile, onClick }) {
  const c = getProfileColors(profile.color)
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${c.pill} rounded-full pl-1 pr-3 py-1 text-sm font-semibold cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm`}
      title="View profile"
    >
      <span className={`w-7 h-7 rounded-full ${c.bgLight} ${c.border} border flex items-center justify-center text-base`}>
        {profile.emoji}
      </span>
      <span>{profile.name}</span>
      {ROLE_LABELS[profile.role] && (
        <span className="text-xs opacity-70">· {ROLE_LABELS[profile.role]}</span>
      )}
    </button>
  )
}
