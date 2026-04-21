import { ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE } from '../../components/ShapeCanvas'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const w = rand(4, 20)
  let h
  do { h = rand(3, 18) } while (h === w)
  return { w, h, answer: w * h }
}

function View({ problem }) {
  const { w, h } = problem
  const x0 = 90, y0 = 35
  const W_px = 175, H_px = 125
  return (
    <div className="text-center">
      <ShapeCanvas>
        <rect x={x0} y={y0} width={W_px} height={H_px} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
        <HDim x1={x0} x2={x0 + W_px} y={y0 + H_px + 28} label={`${w} cm`} />
        <VDim x={x0 - 28} y1={y0} y2={y0 + H_px} label={`${h} cm`} />
      </ShapeCanvas>
      <p className="text-lg font-semibold text-gray-600 -mt-1">Area = ? cm²</p>
    </div>
  )
}

function check(problem, input) {
  return parseInt(input.trim(), 10) === problem.answer
}

function key(problem) {
  // treat w×h and h×w as the same problem
  const [lo, hi] = [Math.min(problem.w, problem.h), Math.max(problem.w, problem.h)]
  return `rect:${lo}x${hi}`
}

function displayAnswer(problem) {
  return `${problem.answer} cm²`
}

export default {
  id: 'rectangle',
  label: 'Rectangles',
  emoji: '▭',
  color: 'from-teal-400 to-teal-600',
  bgLight: 'bg-teal-50',
  border: 'border-teal-200',
  description: 'Area of a rectangle',
  inputHint: 'Area in cm²…',
  group: 'school',
  subgroup: 'areas',
  defaultCount: 10,
  generate,
  View,
  check,
  key,
  displayAnswer,
}
