import { localDateYMD } from '../profiles'

function tier(n) {
  if (n === 0) return 'bg-gray-100'
  if (n <= 3) return 'bg-green-200'
  if (n <= 6) return 'bg-green-400'
  if (n <= 9) return 'bg-green-600'
  return 'bg-green-800'
}

function formatTooltip(date, count) {
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (count === 0) return `No activity · ${dateStr}`
  return `${count} problem${count === 1 ? '' : 's'} · ${dateStr}`
}

/**
 * GitHub-style activity grid.
 * 30 cells laid out in 3 rows × 10 cols, oldest top-left → newest bottom-right.
 * Intensity derived from sum of `session.completed` on that local date.
 */
export default function Heatmap({ sessions, days = 30 }) {
  const byDate = {}
  for (const s of sessions ?? []) {
    byDate[s.date] = (byDate[s.date] ?? 0) + (s.completed ?? 0)
  }

  const today = new Date()
  const cells = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const key = localDateYMD(d)
    cells.push({ key, date: d, count: byDate[key] ?? 0 })
  }

  return (
    <div className="grid grid-cols-10 gap-1">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={formatTooltip(cell.date, cell.count)}
          className={`aspect-square rounded-sm ${tier(cell.count)}`}
        />
      ))}
    </div>
  )
}
