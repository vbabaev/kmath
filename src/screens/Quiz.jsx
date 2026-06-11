import { useState, useEffect, useRef } from 'react'
import { MODULES, toProblemRef } from '../modules'
import ProfileButton from '../components/ProfileButton'
import { useFinn } from '../finn/FinnContext'
import { pickPhrase } from '../finn/phrases'

// Breather between two problems — short pause with an encouraging
// phrase so the kid isn't context-switching at full speed.
const INTERLUDE_MS = 1500
// Infinite mode keeps a sliding window of recent problem keys so the
// random picker doesn't immediately repeat what was just shown.
const INFINITE_RECENT_KEYS = 15
const INFINITE_PICK_TRIES = 30
// Finn's "have you seen the tip?" nudge fires this long into a
// problem if the module exposes tips and the kid hasn't opened any.
const TIP_REMINDER_MS = 20000

function defaultIsComplete(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export default function Quiz({ problems, activeProfile, initialState, isAssignment = false, isInfinite = false, onSnapshot, onFinish, onCancel, onProfileClick }) {
  // queue can grow as failed problems are re-appended; ref keeps closures fresh.
  const [queue, setQueue] = useState(() => initialState?.queue ?? problems)
  const queueRef = useRef(queue)
  const startIndex = initialState?.index ?? 0

  const [index, setIndex] = useState(startIndex)
  const [input, setInput] = useState(() => queue[startIndex]?.module.defaultInput ?? '')
  const [feedback, setFeedback] = useState(null)       // 'correct' | 'wrong' | null
  const [problemAttempts, setProblemAttempts] = useState(initialState?.problemAttempts ?? 0)
  const [totalAttempts, setTotalAttempts] = useState(initialState?.totalAttempts ?? 0)
  const [completedProblems, setCompletedProblems] = useState(initialState?.completedProblems ?? [])
  const [showCancel, setShowCancel] = useState(false)
  // Interlude state: when set, a fullscreen "good job — get ready"
  // screen overlays the quiz for INTERLUDE_MS before the next problem
  // is interactive. `null` = no interlude active.
  const [interlude, setInterlude] = useState(null)
  const inputRef = useRef(null)
  const questionStart = useRef(Date.now())
  // Sliding window of recent problem keys for the infinite-mode picker
  // so we don't immediately repeat what was just shown. Initialised
  // from the existing queue when hydrating from a saved snapshot.
  const recentKeys = useRef(
    new Set(
      queue
        .slice(-INFINITE_RECENT_KEYS)
        .map(({ module, problem }) => module.key(problem)),
    ),
  )
  // Tips reveal one at a time per problem. Modules may export an
  // optional `tips(problem)` returning Array<{ body }>; absent or
  // empty hides the button and the nudge timer entirely.
  const [openTipsCount, setOpenTipsCount] = useState(0)

  const { module, problem } = queue[index]
  const isComplete = module.isComplete ?? defaultIsComplete

  // Set on initial mount; flipped after the first auto-save effect run.
  // Used to skip the very first save when we hydrated from a server-side
  // snapshot — otherwise tab A submits → server T1 → tab B remounts from
  // T1 → tab B's mount-save echoes T1 back as T2 → tab A remounts → ...
  // infinite ping-pong as each tab keeps "discovering" the same state.
  const skipInitialSave = useRef(!!initialState)

  // Set the moment we know this is the quiz's last correct answer.
  // From here on, the auto-save effect must NOT fire — `onFinish` is
  // about to clear `activeQuiz` via the full PUT, and we don't want a
  // late autosave to race past it and restore the last-problem snapshot
  // (which is what was causing "refresh on Results → back to the last
  // problem", and stale snapshots on sibling devices).
  const pendingFinalize = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  // Reset the tips-opened counter when moving to a new problem. The
  // wrong-answer retry keeps the same index, so retries reuse the
  // already-opened tips (intentional — kid shouldn't have to re-open).
  useEffect(() => {
    setOpenTipsCount(0)
  }, [index])

  const tipsForCurrentProblem = module.tips?.(problem) ?? []
  const hasUnopenedTips = openTipsCount < tipsForCurrentProblem.length

  // Finn reacts each time the kid submits — picks a random "nice one!" /
  // "no worries" phrase. Fires on every feedback transition (including
  // wrong → null → wrong on retries), so multi-fail problems still get a
  // fresh line each attempt.
  const { say } = useFinn()
  useEffect(() => {
    if (feedback === 'correct') say('correct')
    else if (feedback === 'wrong') say('wrong')
  }, [feedback, say])

  // Nudge: if the kid sits on a problem with unopened tips for
  // TIP_REMINDER_MS, Finn pipes up with a varied "want a hint?" line.
  // The timer resets on every problem change AND when a tip is opened
  // (an opened tip is engagement — give the kid time with it before
  // nagging again about the next one).
  useEffect(() => {
    if (!hasUnopenedTips) return undefined
    if (feedback === 'correct') return undefined
    const t = setTimeout(() => {
      say('tipReminder', { name: activeProfile?.name ?? '' })
    }, TIP_REMINDER_MS)
    return () => clearTimeout(t)
  }, [index, openTipsCount, hasUnopenedTips, feedback, say, activeProfile?.name])

  // Live-sync write: fires on every meaningful state change (submit,
  // retry, advance) — no debounce, so other tabs / devices see the new
  // state within their poll interval (or instantly via BroadcastChannel).
  // AbortController cancels an in-flight save on unmount so we don't race
  // with cancel/finish writes that clear activeQuiz.
  useEffect(() => {
    if (!onSnapshot) return undefined
    if (skipInitialSave.current) {
      skipInitialSave.current = false
      return undefined
    }
    if (pendingFinalize.current) {
      return undefined
    }
    const snapshot = {
      problems: problems.map(toProblemRef),
      queue: queue.map(toProblemRef),
      index,
      // `score` and `streak` are persisted as 0 to satisfy the backend
      // Zod schema's `int.nonneg` shape on activeQuiz — they're no
      // longer meaningful since stars were removed.
      score: 0,
      streak: 0,
      problemAttempts,
      totalAttempts,
      completedProblems: completedProblems.map((c) => ({
        moduleId: c.module.id,
        problem: c.problem,
        attempts: c.attempts,
        timeMs: c.timeMs,
      })),
      isAssignment,
      isInfinite,
    }
    const ctl = new AbortController()
    onSnapshot(snapshot, ctl.signal)
    return () => ctl.abort()
  }, [problems, queue, index, problemAttempts, totalAttempts, completedProblems, isAssignment, isInfinite, onSnapshot])

  function appendToQueue(item) {
    const next = [...queueRef.current, item]
    queueRef.current = next
    setQueue(next)
  }

  /** Generate the next random problem for infinite mode, biased away
   *  from the last few keys so the kid doesn't see immediate repeats.
   *  Falls back to whatever was generated last if all tries collide.
   *  Pulls from every module across every group (school + extra +
   *  verbal) — infinite mode intentionally ignores the kid's current
   *  group selection so they get a true mixed bag.
   */
  function pickInfiniteNext() {
    if (MODULES.length === 0) return null
    let last = null
    for (let i = 0; i < INFINITE_PICK_TRIES; i++) {
      const mod = MODULES[Math.floor(Math.random() * MODULES.length)]
      const prob = mod.generate()
      const k = mod.key(prob)
      last = { module: mod, problem: prob, key: k }
      if (!recentKeys.current.has(k)) break
    }
    if (!last) return null
    recentKeys.current.add(last.key)
    if (recentKeys.current.size > INFINITE_RECENT_KEYS) {
      // Drop the oldest by rebuilding from the last N items of the queue.
      recentKeys.current = new Set(
        queueRef.current
          .slice(-(INFINITE_RECENT_KEYS - 1))
          .map(({ module, problem }) => module.key(problem))
          .concat(last.key),
      )
    }
    return { module: last.module, problem: last.problem }
  }

  function submit(directValue) {
    const currentInput = directValue !== undefined ? directValue : input
    if (!isComplete(currentInput, problem) || feedback) return

    const newProblemAttempts = problemAttempts + 1
    const newTotalAttempts = totalAttempts + 1
    const correct = module.check(problem, currentInput)

    setProblemAttempts(newProblemAttempts)
    setTotalAttempts(newTotalAttempts)

    if (!correct) {
      setFeedback('wrong')
      appendToQueue({ module, problem: module.generate() })
      setTimeout(() => {
        setFeedback(null)
        setInput(module.defaultInput ?? '')
      }, 900)
      return
    }

    const timeMs = Date.now() - questionStart.current
    // We snapshot `problem` here so the session history can later re-render
    // the exact question the kid saw (used by the History detail page).
    const newCompleted = [...completedProblems, { module, problem, attempts: newProblemAttempts, timeMs }]

    // Suppress further autosaves now if this was the final question —
    // onFinish (fired 900 ms from now) will clear activeQuiz via the
    // full PUT, and we don't want a late autosave restoring it.
    // Infinite mode never auto-finishes; the kid taps "Finish" instead.
    if (!isInfinite && index === queue.length - 1) {
      pendingFinalize.current = true
    }

    setFeedback('correct')
    setCompletedProblems(newCompleted)

    setTimeout(() => {
      const next = index + 1
      let currentQueue = queueRef.current
      // Infinite mode: extend the queue with a fresh random problem
      // *before* we read the next slot so currentQueue[next] is always
      // defined. The kid never auto-finishes; only the Finish button
      // ends an infinite run.
      if (isInfinite && next >= currentQueue.length) {
        const picked = pickInfiniteNext()
        if (picked) {
          appendToQueue(picked)
          currentQueue = queueRef.current
        }
      }
      setFeedback(null)
      setProblemAttempts(0)
      setInput(currentQueue[next]?.module.defaultInput ?? '')
      if (next >= currentQueue.length) {
        // Final problem — straight to results, no breather screen.
        // `score` is kept on the result shape for back-compat with
        // logSession / Results, always 0 since stars were removed.
        questionStart.current = Date.now()
        onFinish({ score: 0, totalAttempts: newTotalAttempts, completedProblems: newCompleted, initialCount: problems.length })
      } else {
        // Advance to the next problem behind a fullscreen interlude.
        // questionStart is intentionally reset at the *end* of the
        // breather so the 3-second pause doesn't count against the
        // kid's solve time for the next problem.
        setIndex(next)
        setInterlude({
          phrase: pickPhrase('interlude', {
            name: activeProfile?.name ?? '',
          }),
        })
        setTimeout(() => {
          setInterlude(null)
          questionStart.current = Date.now()
        }, INTERLUDE_MS)
      }
    }, 900)
  }

  const retryCount = queue.length - problems.length
  const progress = index / queue.length
  const firstTry = problemAttempts === 0
  const unsolved = problems.length - completedProblems.length

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Top bar — profile access (works during assignments too) */}
        {activeProfile && onProfileClick && (
          <div className="flex justify-end mb-3">
            <ProfileButton profile={activeProfile} onClick={onProfileClick} />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {isAssignment ? (
            <span className="text-amber-700 bg-amber-100 border border-amber-300 font-semibold text-xs px-3 py-1 rounded-full">
              📚 Assignment
            </span>
          ) : isInfinite ? (
            <button
              onClick={() => setShowCancel(true)}
              className="text-violet-600 hover:text-violet-800 font-semibold text-sm cursor-pointer"
            >
              🏁 Finish
            </button>
          ) : (
            <button
              onClick={() => setShowCancel(true)}
              className="text-gray-400 hover:text-red-500 text-sm cursor-pointer"
            >
              ✕ Cancel
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm">
              ✓ {completedProblems.length}
              {!isInfinite && <span className="text-indigo-400"> / {problems.length}</span>}
            </span>
          </div>
        </div>

        {/* Progress bar — finite quizzes only. Infinite has no end so a
            ratio bar would just sit at 100%; the solved counter below
            takes its place. */}
        {!isInfinite && (
          <div className="bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
        <p className="text-center text-gray-400 text-sm mb-6">
          {isInfinite ? (
            <>
              <span className="text-violet-600 font-semibold">♾️ {completedProblems.length} solved</span>
            </>
          ) : (
            <>
              {index + 1} / {queue.length}
              {retryCount > 0 && <span className="text-orange-400"> (+{retryCount} retry)</span>}
            </>
          )}
          {' '}— {module.label} {module.emoji}
          {problemAttempts > 0 && (
            <span className="ml-2 text-red-400">({problemAttempts} {problemAttempts === 1 ? 'attempt' : 'attempts'})</span>
          )}
        </p>

        {/* "Show a tip" button — right-aligned, shown only when the
            module exposes tips and at least one is still unopened. */}
        {tipsForCurrentProblem.length > 0 && hasUnopenedTips && (
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setOpenTipsCount((c) => c + 1)}
              className="text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-semibold text-sm px-3 py-1.5 rounded-full cursor-pointer"
            >
              💡 Show a tip
              {tipsForCurrentProblem.length > 1 && (
                <span className="ml-1 text-amber-700">
                  ({openTipsCount + 1} / {tipsForCurrentProblem.length})
                </span>
              )}
            </button>
          </div>
        )}

        {/* Question card */}
        <div
          className={`rounded-3xl p-8 text-center mb-6 shadow-md transition-colors duration-300 ${
            feedback === 'correct'
              ? 'bg-green-100 border-2 border-green-400'
              : feedback === 'wrong'
              ? 'bg-red-100 border-2 border-red-400'
              : 'bg-white border-2 border-gray-100'
          }`}
        >
          {feedback === 'correct' && module.CorrectView ? (
            <module.CorrectView problem={problem} input={input} />
          ) : (
            <module.View problem={problem} />
          )}
          {feedback === 'correct' && (
            <p className="mt-4 text-green-600 font-semibold text-lg">
              ✓ Correct!
            </p>
          )}
          {feedback === 'wrong' && (
            <p className="mt-4 text-red-600 font-semibold text-lg">
              ✗ Not quite — try again!
            </p>
          )}
        </div>

        {/* Revealed tips — stacked between the question and the input
            in the order they were opened. */}
        {tipsForCurrentProblem.slice(0, openTipsCount).map((tip, i) => (
          <div
            key={i}
            className="mb-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-gray-800 text-sm leading-relaxed"
          >
            <div className="font-semibold text-amber-800 text-xs uppercase tracking-wide mb-1">
              💡 Tip{tipsForCurrentProblem.length > 1 ? ` ${i + 1} / ${tipsForCurrentProblem.length}` : ''}
            </div>
            <div>{tip.body}</div>
          </div>
        ))}

        {/* Input — custom per module or default text */}
        {module.Input ? (
          <module.Input
            value={input}
            onChange={setInput}
            onSubmit={submit}
            disabled={!!feedback}
            problem={problem}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={!!feedback}
            placeholder={module.inputHint ?? 'Your answer…'}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-xl text-center focus:outline-none focus:border-indigo-400 mb-4 disabled:opacity-50"
          />
        )}

        {!module.Input && (
          <button
            onClick={() => submit()}
            disabled={!!feedback || !isComplete(input, problem)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            Check Answer
          </button>
        )}
      </div>

      {/* Between-problems breather — a fullscreen pause for ~1.5 s
          with a random encouraging phrase. No countdown / progress
          indicator — the phrase is the whole content. */}
      {interlude && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center z-40 px-6">
          <div className="text-center max-w-md w-full">
            <div className="text-6xl mb-6 animate-bounce">✨</div>
            <p className="text-3xl font-bold text-gray-800 leading-snug">
              {interlude.phrase}
            </p>
          </div>
        </div>
      )}

      {/* Cancel / finish confirmation modal. Two flavours:
          - Normal quiz: confirm and lose in-progress quiz state.
          - Infinite mode: "finish" is a positive action — session is
            logged, Results screen follows. */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            {isInfinite ? (
              <>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Stop and see your results?</h3>
                <p className="text-gray-700 mb-5">
                  You've solved{' '}
                  <span className="font-bold">{completedProblems.length}</span>{' '}
                  problem{completedProblems.length !== 1 ? 's' : ''} so far — nice work!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancel(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 cursor-pointer"
                  >
                    Keep going
                  </button>
                  <button
                    onClick={() => {
                      setShowCancel(false)
                      pendingFinalize.current = true
                      onFinish({
                        score: 0,
                        totalAttempts,
                        completedProblems,
                        initialCount: completedProblems.length,
                      })
                    }}
                    className="flex-1 py-3 rounded-2xl bg-violet-500 text-white font-semibold hover:bg-violet-600 cursor-pointer"
                  >
                    Yes, finish
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Cancel this quiz?</h3>
                <p className="text-gray-700 mb-5">
                  You have <span className="font-bold">{Math.max(0, unsolved)}</span>{' '}
                  {unsolved === 1 ? 'problem' : 'problems'} left to solve. If you cancel,
                  your progress on this quiz will be lost.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancel(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 cursor-pointer"
                  >
                    Keep playing
                  </button>
                  <button
                    onClick={() => {
                      setShowCancel(false)
                      onCancel()
                    }}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 cursor-pointer"
                  >
                    Yes, cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
