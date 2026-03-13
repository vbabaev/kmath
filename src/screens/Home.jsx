import { useState } from 'react'
import { MODULES } from '../modules'

const QUICK_QUIZ_COUNT = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateProblems(counts) {
  const problems = []
  for (const mod of MODULES) {
    const n = counts[mod.id] ?? 0
    const seen = new Set()
    let tries = 0
    while (problems.filter((p) => p.module === mod).length < n && tries < n * 20) {
      const problem = mod.generate()
      const k = mod.key(problem)
      if (!seen.has(k)) {
        seen.add(k)
        problems.push({ module: mod, problem })
      }
      tries++
    }
  }
  return shuffle(problems)
}

export default function Home({ onStart }) {
  const [mode, setMode] = useState('list') // 'list' | 'custom'
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(MODULES.map((m) => [m.id, 0]))
  )

  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  function quickQuiz(mod) {
    onStart(generateProblems({ [mod.id]: QUICK_QUIZ_COUNT }))
  }

  function startCustom() {
    if (total === 0) return
    onStart(generateProblems(counts))
  }

  function setCount(id, delta) {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, Math.min(20, (prev[id] ?? 0) + delta)) }))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧮</div>
          <h1 className="text-4xl font-bold text-indigo-700 mb-1">KMath</h1>
          <p className="text-gray-400 text-base">5th Grade Math Practice</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-100">
          <button
            onClick={() => setMode('list')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'list' ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Quick Quiz
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'custom' ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Mix
          </button>
        </div>

        {mode === 'list' && (
          <div className="flex flex-col gap-3">
            {MODULES.map((mod) => (
              <div
                key={mod.id}
                className={`${mod.bgLight} ${mod.border} border-2 rounded-2xl px-5 py-4 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mod.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{mod.label}</div>
                    <div className="text-sm text-gray-500">{mod.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => quickQuiz(mod)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-sm font-semibold text-gray-700 px-4 py-2 rounded-xl shadow-sm cursor-pointer"
                >
                  Start →
                </button>
              </div>
            ))}
            <p className="text-center text-gray-400 text-xs mt-2">{QUICK_QUIZ_COUNT} questions per topic</p>
          </div>
        )}

        {mode === 'custom' && (
          <div className="flex flex-col gap-3">
            {MODULES.map((mod) => (
              <div
                key={mod.id}
                className={`${mod.bgLight} ${mod.border} border-2 rounded-2xl px-5 py-4 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mod.emoji}</span>
                  <div className="font-semibold text-gray-800">{mod.label}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCount(mod.id, -1)}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-gray-800">{counts[mod.id]}</span>
                  <button
                    onClick={() => setCount(mod.id, +1)}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={startCustom}
              disabled={total === 0}
              className="mt-2 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-default cursor-pointer"
            >
              {total === 0 ? 'Pick at least 1 question' : `Start ${total}-Question Mix →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
