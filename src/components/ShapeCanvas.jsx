export const SHAPE_FILL = '#dbeafe'
export const SHAPE_STROKE = '#2563eb'
const DIM_COLOR = '#6b7280'
const LABEL_COLOR = '#1f2937'

export function ShapeCanvas({ children, width = 300, height = 210 }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs mx-auto">
      {children}
    </svg>
  )
}

/** Horizontal dimension line with end ticks and a label centered above */
export function HDim({ x1, x2, y, label, below = false }) {
  const tick = 5
  const mid = (x1 + x2) / 2
  const textY = below ? y + 16 : y - 8
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIM_COLOR} strokeWidth="1.5" />
      <line x1={x1} y1={y - tick} x2={x1} y2={y + tick} stroke={DIM_COLOR} strokeWidth="1.5" />
      <line x1={x2} y1={y - tick} x2={x2} y2={y + tick} stroke={DIM_COLOR} strokeWidth="1.5" />
      <text x={mid} y={textY} textAnchor="middle" fontSize="13" fontWeight="600" fill={LABEL_COLOR}>
        {label}
      </text>
    </g>
  )
}

/** Vertical dimension line with end ticks and a label to the side */
export function VDim({ x, y1, y2, label, right = false }) {
  const tick = 5
  const mid = (y1 + y2) / 2
  const textX = right ? x + 10 : x - 10
  const anchor = right ? 'start' : 'end'
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={DIM_COLOR} strokeWidth="1.5" />
      <line x1={x - tick} y1={y1} x2={x + tick} y2={y1} stroke={DIM_COLOR} strokeWidth="1.5" />
      <line x1={x - tick} y1={y2} x2={x + tick} y2={y2} stroke={DIM_COLOR} strokeWidth="1.5" />
      <text x={textX} y={mid} textAnchor={anchor} dominantBaseline="middle" fontSize="13" fontWeight="600" fill={LABEL_COLOR}>
        {label}
      </text>
    </g>
  )
}
