import { getAllProfiles, getProfileColors } from '../profiles'

export default function ProfilePicker({ onSelect }) {
  const profiles = getAllProfiles()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="text-5xl mb-3">🧮</div>
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">Who's playing?</h1>
        <p className="text-gray-400">Pick your profile</p>
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
      </div>
    </div>
  )
}
