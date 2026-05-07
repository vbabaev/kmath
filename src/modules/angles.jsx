function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ESTIMATE_VALUES = [30, 45, 60, 90, 120, 135, 150, 180]

const CATEGORIES = [
  { id: 'acute',    label: 'Acute',    range: [20, 85, 5] },
  { id: 'right',    label: 'Right',    range: [90, 90, 0] },
  { id: 'obtuse',   label: 'Obtuse',   range: [95, 175, 5] },
  { id: 'straight', label: 'Straight', range: [180, 180, 0] },
  { id: 'reflex',   label: 'Reflex',   range: [195, 340, 5] },
]
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
const CATEGORY_IDS = CATEGORIES.map((c) => c.id)

function pickCategoryAngle(cat) {
  const [min, max, step] = cat.range
  if (step === 0) return min
  return min + step * rand(0, (max - min) / step)
}

function generateEstimate() {
  const answer = pick(ESTIMATE_VALUES)
  // ±3° jitter is safe — smallest gap between bucket values is 15°.
  let jitter = rand(-3, 3)
  if (answer === 180 && jitter > 0) jitter = -jitter
  return {
    kind: 'estimate',
    angle: answer + jitter,
    rotation: rand(0, 359),
    answer,
    choices: ESTIMATE_VALUES,
  }
}

function generateClassify() {
  const cat = pick(CATEGORIES)
  return {
    kind: 'classify',
    angle: pickCategoryAngle(cat),
    rotation: rand(0, 359),
    answer: cat.id,
    choices: CATEGORY_IDS,
  }
}

function generateTriangle() {
  let a, b, c
  while (true) {
    a = 5 * rand(5, 24) // 25..120
    b = 5 * rand(5, 24)
    c = 180 - a - b
    if (c >= 25 && c <= 120) break
  }
  const angles = [a, b, c]
  const hiddenIdx = rand(0, 2)
  const answer = angles[hiddenIdx]
  const shown = angles.filter((_, i) => i !== hiddenIdx)

  const candidates = []
  for (const d of [-30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30]) {
    const v = answer + d
    if (v >= 10 && v <= 170 && v !== answer && !shown.includes(v)) candidates.push(v)
  }
  const distractors = shuffle(candidates).slice(0, 3)
  return {
    kind: 'triangle',
    angles,
    hiddenIdx,
    answer,
    choices: shuffle([answer, ...distractors]),
  }
}

function generate() {
  const r = Math.random()
  if (r < 1 / 3) return generateEstimate()
  if (r < 2 / 3) return generateClassify()
  return generateTriangle()
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

function AngleCanvas({ angle, rotation }) {
  const W = 320, H = 280
  const cx = 160, cy = 140
  const L = 130
  const r = 38
  const rad1 = (rotation * Math.PI) / 180
  const rad2 = ((rotation + angle) * Math.PI) / 180
  const x1 = cx + L * Math.cos(rad1)
  const y1 = cy - L * Math.sin(rad1)
  const x2 = cx + L * Math.cos(rad2)
  const y2 = cy - L * Math.sin(rad2)
  const ax1 = cx + r * Math.cos(rad1)
  const ay1 = cy - r * Math.sin(rad1)
  const ax2 = cx + r * Math.cos(rad2)
  const ay2 = cy - r * Math.sin(rad2)
  // sweep-flag=0 with y-down draws CCW visually; large-arc for reflex angles.
  const largeArc = angle > 180 ? 1 : 0
  const arcD =
    `M ${cx} ${cy} L ${ax1.toFixed(1)} ${ay1.toFixed(1)} ` +
    `A ${r} ${r} 0 ${largeArc} 0 ${ax2.toFixed(1)} ${ay2.toFixed(1)} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto">
      <path d={arcD} fill="rgba(14, 165, 233, 0.18)" stroke="#0284c7" strokeWidth="2" />
      <line
        x1={cx} y1={cy} x2={x1.toFixed(1)} y2={y1.toFixed(1)}
        stroke="#1f2937" strokeWidth="3" strokeLinecap="round"
      />
      <line
        x1={cx} y1={cy} x2={x2.toFixed(1)} y2={y2.toFixed(1)}
        stroke="#1f2937" strokeWidth="3" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#1f2937" />
    </svg>
  )
}

function TriangleCanvas({ angles, hiddenIdx, revealed = false }) {
  const aRad = (angles[0] * Math.PI) / 180
  const bRad = (angles[1] * Math.PI) / 180
  const gRad = (angles[2] * Math.PI) / 180
  // Math coords (y up): A=(0,0), B=(1,0). Side AC has length sin(B)/sin(C) by law of sines.
  const bSide = Math.sin(bRad) / Math.sin(gRad)
  const Cmx = bSide * Math.cos(aRad)
  const Cmy = bSide * Math.sin(aRad)
  const minX = Math.min(0, Cmx)
  const maxX = Math.max(1, Cmx)
  const W = 320, H = 240, pad = 50
  const scale = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / Cmy)
  const offX = W / 2 - ((minX + maxX) / 2) * scale
  function toSvg(x, y) {
    return [offX + x * scale, H - pad - y * scale]
  }
  const verts = [toSvg(0, 0), toSvg(1, 0), toSvg(Cmx, Cmy)]
  const polyPts = verts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const centX = (verts[0][0] + verts[1][0] + verts[2][0]) / 3
  const centY = (verts[0][1] + verts[1][1] + verts[2][1]) / 3
  const labelPos = verts.map(([vx, vy]) => {
    const dx = centX - vx, dy = centY - vy
    const d = Math.sqrt(dx * dx + dy * dy)
    return [vx + (dx / d) * 32, vy + (dy / d) * 32]
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto">
      <polygon points={polyPts} fill="rgba(14, 165, 233, 0.18)" stroke="#0284c7" strokeWidth="2.5" />
      {verts.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill="#1f2937" />
      ))}
      {labelPos.map(([lx, ly], i) => {
        const isHidden = i === hiddenIdx
        const fill = revealed && isHidden ? '#16a34a' : isHidden ? '#dc2626' : '#1f2937'
        const text = isHidden && !revealed ? '?' : `${angles[i]}°`
        return (
          <text
            key={i}
            x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="17" fontWeight="700" fill={fill}
          >
            {text}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Views ───────────────────────────────────────────────────────────────────

function View({ problem }) {
  if (problem.kind === 'triangle') {
    return (
      <div className="text-center">
        <TriangleCanvas angles={problem.angles} hiddenIdx={problem.hiddenIdx} />
        <p className="text-lg font-semibold text-gray-600 mt-1">Find the missing angle</p>
      </div>
    )
  }
  const prompt = problem.kind === 'estimate' ? 'Closest value?' : 'What kind of angle is this?'
  return (
    <div className="text-center">
      <AngleCanvas angle={problem.angle} rotation={problem.rotation} />
      <p className="text-lg font-semibold text-gray-600 mt-1">{prompt}</p>
    </div>
  )
}

function CorrectView({ problem }) {
  if (problem.kind === 'triangle') {
    return (
      <div className="text-center">
        <TriangleCanvas angles={problem.angles} hiddenIdx={problem.hiddenIdx} revealed />
        <div className="mt-2 inline-block px-5 py-2 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-2xl animate-[bounce_0.7s_ease-out]">
          {problem.answer}°
        </div>
      </div>
    )
  }
  const label =
    problem.kind === 'classify' ? CATEGORY_LABEL[problem.answer] : `${problem.answer}°`
  return (
    <div className="text-center">
      <AngleCanvas angle={problem.angle} rotation={problem.rotation} />
      <div className="mt-2 inline-block px-5 py-2 rounded-2xl bg-green-100 border-2 border-green-400 text-green-700 font-bold text-2xl animate-[bounce_0.7s_ease-out]">
        {label}
      </div>
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

function Input({ value, onChange, onSubmit, disabled, problem }) {
  function handle(c) {
    if (disabled) return
    onChange(c)
    onSubmit(c)
  }
  const isClassify = problem.kind === 'classify'
  // Both literals appear in source so Tailwind JIT picks them up.
  const gridClass = isClassify ? 'grid-cols-5' : 'grid-cols-4'
  return (
    <div className={`grid ${gridClass} gap-2 mb-4`}>
      {problem.choices.map((c) => {
        const label = isClassify ? CATEGORY_LABEL[c] : `${c}°`
        return (
          <button
            key={String(c)}
            onClick={() => handle(c)}
            disabled={disabled}
            className={`py-3 rounded-2xl text-base md:text-lg font-bold border-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-default ${
              value === c
                ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                : 'bg-white border-gray-200 text-gray-800 hover:border-sky-300 hover:bg-sky-50'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Module hooks ────────────────────────────────────────────────────────────

function check(problem, value) {
  return value === problem.answer
}

function isComplete(value, problem) {
  if (value === null || value === undefined) return false
  return problem.choices.includes(value)
}

function key(problem) {
  if (problem.kind === 'estimate') return `ang:est:${problem.angle}:${problem.rotation}`
  if (problem.kind === 'classify') return `ang:cls:${problem.angle}:${problem.rotation}`
  return `ang:tri:${problem.angles.join('-')}-${problem.hiddenIdx}`
}

function displayAnswer(problem) {
  if (problem.kind === 'classify') return CATEGORY_LABEL[problem.answer]
  return `${problem.answer}°`
}

export default {
  id: 'angles',
  label: 'Angles',
  emoji: '📐',
  color: 'from-sky-400 to-cyan-500',
  bgLight: 'bg-sky-50',
  border: 'border-sky-200',
  description: 'Estimate, classify, and find missing triangle angles',
  defaultInput: null,
  defaultCount: 10,
  group: 'school',
  generate,
  View,
  CorrectView,
  Input,
  check,
  isComplete,
  key,
  displayAnswer,
}
