import { ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE } from '../components/ShapeCanvas'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const W = rand(8, 18)
  const H = rand(6, 14)
  // cut is 20–45% of each dimension so it's clearly visible
  const cw = rand(Math.ceil(W * 0.2), Math.floor(W * 0.45))
  const ch = rand(Math.ceil(H * 0.2), Math.floor(H * 0.45))
  return { W, H, cw, ch, answer: W * H - cw * ch }
}

function View({ problem }) {
  const { W, H, cw, ch } = problem

  // Canvas: 320×245
  const x0 = 80, y0 = 45
  const W_px = 185, H_px = 130
  const cw_px = Math.round((cw / W) * W_px)
  const ch_px = Math.round((ch / H) * H_px)

  // L-shape: top-right corner cut out
  const pts = [
    [x0,               y0],
    [x0 + W_px - cw_px, y0],
    [x0 + W_px - cw_px, y0 + ch_px],
    [x0 + W_px,         y0 + ch_px],
    [x0 + W_px,         y0 + H_px],
    [x0,                y0 + H_px],
  ]
  const polyPoints = pts.map(([px, py]) => `${px},${py}`).join(' ')

  return (
    <div className="text-center">
      <ShapeCanvas width={370} height={245}>
        {/* Main L-shape */}
        <polygon points={polyPoints} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />

        {/* Dashed ghost lines for the missing corner */}
        <line
          x1={x0 + W_px - cw_px} y1={y0}
          x2={x0 + W_px}          y2={y0}
          stroke={SHAPE_STROKE} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.45"
        />
        <line
          x1={x0 + W_px} y1={y0}
          x2={x0 + W_px} y2={y0 + ch_px}
          stroke={SHAPE_STROKE} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.45"
        />

        {/* Total width W — bottom */}
        <HDim x1={x0} x2={x0 + W_px} y={y0 + H_px + 28} label={`${W} cm`} />

        {/* Total height H — left */}
        <VDim x={x0 - 28} y1={y0} y2={y0 + H_px} label={`${H} cm`} />

        {/* Cut width cw — above the gap */}
        <HDim x1={x0 + W_px - cw_px} x2={x0 + W_px} y={y0 - 20} label={`${cw} cm`} />

        {/* Cut height ch — right of the gap */}
        <VDim x={x0 + W_px + 28} y1={y0} y2={y0 + ch_px} label={`${ch} cm`} right />
      </ShapeCanvas>
      <p className="text-lg font-semibold text-gray-600 -mt-1">Area = ? cm²</p>
    </div>
  )
}

function check(problem, input) {
  return parseInt(input.trim(), 10) === problem.answer
}

function key(problem) {
  return `cutout:${problem.W}x${problem.H}-${problem.cw}x${problem.ch}`
}

function displayAnswer(problem) {
  return `${problem.answer} cm²`
}

export default {
  id: 'rectangleCutout',
  label: 'Rectangles with cut-out',
  emoji: '📐',
  color: 'from-indigo-400 to-indigo-600',
  bgLight: 'bg-indigo-50',
  border: 'border-indigo-200',
  description: 'Area of a rectangle with a corner removed',
  inputHint: 'Area in cm²…',
  group: 'extra',
  defaultCount: 10,
  generate,
  View,
  check,
  key,
  displayAnswer,
}
