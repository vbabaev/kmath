// 5 big mood cards shown before AND after each assignment. Required —
// no skip option. The user picks one and `onPick(mood)` fires. Used by
// `App.jsx`'s `mood-start` and `mood-end` screens.
//
// Mood values are persisted on the session entry (`moodStart` / `moodEnd`)
// and on the live in-flight mood held in App-level React state. We
// deliberately do NOT stash them on `activeQuiz` — that would invite
// monotonic-sync conflicts and serialization edge cases on F5.

import { useEffect } from 'react'
import { useFinn } from '../finn/FinnContext'

// Hard-coded class strings: Tailwind JIT must see them as literals.
export const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great',
    bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', hover: 'hover:bg-emerald-100' },
  { id: 'good',  emoji: '😊', label: 'Good',
    bg: 'bg-lime-50',    border: 'border-lime-300',    text: 'text-lime-700',    hover: 'hover:bg-lime-100' },
  { id: 'okay',  emoji: '😐', label: 'Okay',
    bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-700',   hover: 'hover:bg-amber-100' },
  { id: 'meh',   emoji: '😟', label: 'Meh',
    bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-700',  hover: 'hover:bg-orange-100' },
  { id: 'sad',   emoji: '😢', label: 'Sad',
    bg: 'bg-rose-50',    border: 'border-rose-300',    text: 'text-rose-700',    hover: 'hover:bg-rose-100' },
]

export function getMood(id) {
  return MOODS.find((m) => m.id === id) ?? null
}

export default function MoodPicker({ title, subtitle, onPick, bubbleCategory, profileName }) {
  // Finn asks the same question as the page title, but with friendly
  // randomized phrasing. App.jsx passes `bubbleCategory` = 'moodStart'
  // or 'moodEnd' depending on which side of the assignment we're on.
  const { say } = useFinn()
  useEffect(() => {
    if (bubbleCategory) say(bubbleCategory, { name: profileName })
  }, [say, bubbleCategory, profileName])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-500 mb-8">{subtitle}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              className={`${m.bg} ${m.border} ${m.text} ${m.hover} border-2 rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer`}
            >
              <span className="text-5xl sm:text-6xl leading-none">{m.emoji}</span>
              <span className="font-bold text-sm sm:text-base">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
