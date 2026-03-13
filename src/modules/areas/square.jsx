import { ShapeCanvas, HDim, VDim, SHAPE_FILL, SHAPE_STROKE } from '../../components/ShapeCanvas'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generate() {
  const a = rand(3, 20)
  return { a, answer: a * a }
}

function View({ problem }) {
  const { a } = problem
  const x0 = 90, y0 = 30, side = 135
  return (
    <div className="text-center">
      <ShapeCanvas>
        <rect x={x0} y={y0} width={side} height={side} fill={SHAPE_FILL} stroke={SHAPE_STROKE} strokeWidth="2.5" />
        <HDim x1={x0} x2={x0 + side} y={y0 + side + 28} label={`${a} cm`} />
        <VDim x={x0 - 28} y1={y0} y2={y0 + side} label={`${a} cm`} />
      </ShapeCanvas>
      <p className="text-lg font-semibold text-gray-600 -mt-1">Area = ? cm²</p>
    </div>
  )
}

function check(problem, input) {
  return parseInt(input.trim(), 10) === problem.answer
}

function key(problem) {
  return `sq:${problem.a}`
}

function displayAnswer(problem) {
  return `${problem.answer} cm²`
}

export default {
  id: 'square',
  label: 'Squares',
  emoji: '⬜',
  color: 'from-sky-400 to-sky-600',
  bgLight: 'bg-sky-50',
  border: 'border-sky-200',
  description: 'Area of a square',
  inputHint: 'Area in cm²…',
  group: 'areas',
  generate,
  View,
  check,
  key,
  displayAnswer,
}
