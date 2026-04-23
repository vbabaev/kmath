import { getModule } from '../modules'

export default function ModuleTag({ moduleId, count }) {
  const mod = getModule(moduleId)
  if (!mod) return null
  return (
    <span
      className={`${mod.bgLight} ${mod.border} border rounded-full pl-2 pr-2.5 py-1 text-xs font-semibold text-gray-700 inline-flex items-center gap-1 whitespace-nowrap`}
    >
      <span className="text-sm leading-none">{mod.emoji}</span>
      <span>{mod.label}</span>
      {count > 1 && <span className="text-gray-500">× {count}</span>}
    </span>
  )
}

export function moduleTagsFromCounts(counts) {
  return Object.entries(counts ?? {})
    .filter(([, n]) => n > 0)
    .map(([moduleId, count]) => ({ moduleId, count }))
}
