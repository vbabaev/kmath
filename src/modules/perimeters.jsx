import { ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE } from '../components/ShapeCanvas'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const SHAPES = ['square', 'rectangle', 'rhombus', 'trapezoid', 'pentagon', 'cutout']

function generate() {
  const shape = SHAPES[rand(0, SHAPES.length - 1)]
  switch (shape) {
    case 'square': {
      const a = rand(3, 20)
      return { shape, a, answer: 4 * a }
    }
    case 'rectangle': {
      const w = rand(4, 20)
      let h; do { h = rand(3, 18) } while (h === w)
      return { shape, w, h, answer: 2 * (w + h) }
    }
    case 'rhombus': {
      const a = rand(3, 20)
      return { shape, a, answer: 4 * a }
    }
    case 'trapezoid': {
      // Isosceles: bottom a, top b < a, equal legs c
      const a = rand(8, 20)
      const b = rand(3, a - 3)
      const c = rand(4, 14)
      return { shape, a, b, c, answer: a + b + 2 * c }
    }
    case 'pentagon': {
      const a = rand(3, 16)
      return { shape, a, answer: 5 * a }
    }
    case 'cutout': {
      const W = rand(8, 18)
      const H = rand(6, 14)
      const cw = rand(Math.ceil(W * 0.2), Math.floor(W * 0.45))
      const ch = rand(Math.ceil(H * 0.2), Math.floor(H * 0.45))
      // Perimeter of L-shape = 2W + 2H (same as full rectangle, but students must sum 6 sides)
      return { shape, W, H, cw, ch, answer: 2 * W + 2 * H }
    }
  }
}

// Places a label offset outward from the midpoint of a polygon side.
// cx/cy is the polygon center (used to determine outward direction).
function SideLabel({ x1, y1, x2, y2, label, cx, cy, offset = 22 }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const ox = mx - cx, oy = my - cy
  const d = Math.sqrt(ox * ox + oy * oy)
  return (
    <text
      x={mx + (ox / d) * offset}
      y={my + (oy / d) * offset}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="13"
      fontWeight="600"
      fill="#1f2937"
    >
      {label}
    </text>
  )
}

// Short perpendicular tick mark at the midpoint of a side (equal-sides notation)
function TickMark({ x1, y1, x2, y2, size = 6 }) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len, uy = dy / len
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  return (
    <line
      x1={mx + uy * size} y1={my - ux * size}
      x2={mx - uy * size} y2={my + ux * size}
      stroke="#6b7280" strokeWidth="1.5"
    />
  )
}

function SquareView({ a }) {
  const x0 = 90, y0 = 30, side = 135
  return (
    <ShapeCanvas>
      <rect x={x0} y={y0} width={side} height={side} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
      <HDim x1={x0} x2={x0 + side} y={y0 + side + 28} label={`${a} cm`} />
      <VDim x={x0 - 28} y1={y0} y2={y0 + side} label={`${a} cm`} />
    </ShapeCanvas>
  )
}

function RectangleView({ w, h }) {
  const x0 = 65, y0 = 35
  const W_px = 175, H_px = 125
  return (
    <ShapeCanvas>
      <rect x={x0} y={y0} width={W_px} height={H_px} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
      <HDim x1={x0} x2={x0 + W_px} y={y0 + H_px + 28} label={`${w} cm`} />
      <VDim x={x0 - 28} y1={y0} y2={y0 + H_px} label={`${h} cm`} />
    </ShapeCanvas>
  )
}

function RhombusView({ a }) {
  const cx = 150, cy = 107
  const T = [cx, 30], R = [cx + 82, cy], B = [cx, cy * 2 - 30], L = [cx - 82, cy]
  const pts = [T, R, B, L].map(([x, y]) => `${x},${y}`).join(' ')
  const sides = [[T, R], [R, B], [B, L], [L, T]]
  return (
    <ShapeCanvas>
      <polygon points={pts} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
      {sides.map(([[x1, y1], [x2, y2]], i) => (
        <TickMark key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
      <SideLabel x1={T[0]} y1={T[1]} x2={R[0]} y2={R[1]} label={`${a} cm`} cx={cx} cy={cy} />
    </ShapeCanvas>
  )
}

function TrapezoidView({ a, b, c }) {
  const cx = 150, bottomY = 172, topY = 57
  const W_px = 185
  const topW = Math.round((b / a) * W_px)
  const x1 = cx - W_px / 2, x2 = cx + W_px / 2   // bottom-left, bottom-right
  const x3 = cx + topW / 2, x4 = cx - topW / 2   // top-right, top-left
  const mcy = (bottomY + topY) / 2
  const pts = `${x1},${bottomY} ${x2},${bottomY} ${x3},${topY} ${x4},${topY}`
  return (
    <ShapeCanvas height={230}>
      <polygon points={pts} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
      <HDim x1={x1} x2={x2} y={bottomY + 28} label={`${a} cm`} />
      <HDim x1={x4} x2={x3} y={topY - 20} label={`${b} cm`} />
      <SideLabel x1={x1} y1={bottomY} x2={x4} y2={topY} label={`${c} cm`} cx={cx} cy={mcy} />
      <SideLabel x1={x2} y1={bottomY} x2={x3} y2={topY} label={`${c} cm`} cx={cx} cy={mcy} />
    </ShapeCanvas>
  )
}

function PentagonView({ a }) {
  const R = 78, CX = 150, CY = 112
  const pts = Array.from({ length: 5 }, (_, k) => [
    CX + R * Math.sin((2 * Math.PI * k) / 5),
    CY - R * Math.cos((2 * Math.PI * k) / 5),
  ])
  const polyPts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  // pts[2] = bottom-right, pts[3] = bottom-left (horizontal bottom edge)
  const [brx, bry] = pts[2]
  const [blx] = pts[3]
  return (
    <ShapeCanvas height={235}>
      <polygon points={polyPts} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
      {pts.map((p, i) => {
        const next = pts[(i + 1) % 5]
        return <TickMark key={i} x1={p[0]} y1={p[1]} x2={next[0]} y2={next[1]} />
      })}
      <HDim x1={blx} x2={brx} y={bry + 28} label={`${a} cm`} />
    </ShapeCanvas>
  )
}

function CutoutView({ W, H, cw, ch }) {
  const x0 = 90, y0 = 50
  const W_px = 185, H_px = 130
  const cw_px = Math.round((cw / W) * W_px)
  const ch_px = Math.round((ch / H) * H_px)

  const pts = [
    [x0,               y0],
    [x0 + W_px - cw_px, y0],
    [x0 + W_px - cw_px, y0 + ch_px],
    [x0 + W_px,         y0 + ch_px],
    [x0 + W_px,         y0 + H_px],
    [x0,               y0 + H_px],
  ]
  const polyPts = pts.map(([x, y]) => `${x},${y}`).join(' ')

  const innerX = x0 + W_px - cw_px  // x of inner vertical edge
  const innerY = y0 + ch_px         // y of inner horizontal edge

  return (
    <ShapeCanvas width={385} height={255}>
      <polygon points={polyPts} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />

      {/* Dashed ghost lines for the missing corner */}
      <line x1={innerX} y1={y0} x2={x0 + W_px} y2={y0}
        stroke={SHAPE_STROKE} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.4" />
      <line x1={x0 + W_px} y1={y0} x2={x0 + W_px} y2={innerY}
        stroke={SHAPE_STROKE} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.4" />

      {/* Outer sides */}
      <HDim x1={x0} x2={x0 + W_px} y={y0 + H_px + 28} label={`${W} cm`} />
      <VDim x={x0 - 28} y1={y0} y2={y0 + H_px} label={`${H} cm`} />
      <HDim x1={x0} x2={innerX} y={y0 - 20} label={`${W - cw} cm`} />
      <VDim x={x0 + W_px + 28} y1={innerY} y2={y0 + H_px} label={`${H - ch} cm`} right />

      {/* Inner sides: text annotations inside the empty cutout corner */}
      <text
        x={innerX + cw_px / 2} y={innerY - 10}
        textAnchor="middle" fontSize="12" fontWeight="600" fill="#1f2937"
      >{cw} cm</text>
      <text
        x={innerX + 8} y={y0 + ch_px / 2}
        textAnchor="start" dominantBaseline="middle" fontSize="12" fontWeight="600" fill="#1f2937"
      >{ch} cm</text>
    </ShapeCanvas>
  )
}

const SHAPE_VIEWS = {
  square:    (p) => <SquareView a={p.a} />,
  rectangle: (p) => <RectangleView w={p.w} h={p.h} />,
  rhombus:   (p) => <RhombusView a={p.a} />,
  trapezoid: (p) => <TrapezoidView a={p.a} b={p.b} c={p.c} />,
  pentagon:  (p) => <PentagonView a={p.a} />,
  cutout:    (p) => <CutoutView W={p.W} H={p.H} cw={p.cw} ch={p.ch} />,
}

function View({ problem }) {
  return (
    <div className="text-center">
      {SHAPE_VIEWS[problem.shape](problem)}
      <p className="text-lg font-semibold text-gray-600 -mt-1">Perimeter = ? cm</p>
    </div>
  )
}

function check(problem, input) {
  return parseInt(input.trim(), 10) === problem.answer
}

function key(problem) {
  const { shape: s } = problem
  if (s === 'square')    return `perim:sq:${problem.a}`
  if (s === 'rectangle') return `perim:rect:${Math.min(problem.w, problem.h)}x${Math.max(problem.w, problem.h)}`
  if (s === 'rhombus')   return `perim:rhombus:${problem.a}`
  if (s === 'trapezoid') return `perim:trap:${problem.a}-${problem.b}-${problem.c}`
  if (s === 'pentagon')  return `perim:pent:${problem.a}`
  return `perim:cut:${problem.W}x${problem.H}-${problem.cw}x${problem.ch}`
}

function displayAnswer(problem) {
  return `${problem.answer} cm`
}

export default {
  id: 'perimeters',
  label: 'Perimeters',
  emoji: '📏',
  color: 'from-emerald-400 to-emerald-600',
  bgLight: 'bg-emerald-50',
  border: 'border-emerald-200',
  description: 'Perimeter of squares, rectangles, rhombuses, trapezoids, pentagons & L-shapes',
  inputHint: 'Perimeter in cm…',
  defaultCount: 10,
  generate,
  View,
  check,
  key,
  displayAnswer,
}
