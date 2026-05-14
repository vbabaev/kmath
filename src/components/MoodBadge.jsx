import { getMood } from '../screens/MoodPicker'

// Compact mood pill — emoji + label, tinted by mood. Shows "–" if the
// session predates the mood feature or the mood wasn't captured.
export default function MoodBadge({ mood, size = 'sm' }) {
  const m = getMood(mood)
  if (!m) {
    return (
      <span className="inline-flex items-center text-xs text-gray-400">–</span>
    )
  }
  const px = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={`${m.bg} ${m.border} ${m.text} border rounded-full font-semibold inline-flex items-center gap-1 ${px}`}
    >
      <span className="leading-none">{m.emoji}</span>
      <span>{m.label}</span>
    </span>
  )
}
