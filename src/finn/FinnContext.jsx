import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { pickPhrase, pickAssignmentsPhrase } from './phrases'

// Speech-bubble visibility in milliseconds. User asked for ~15-20s.
const BUBBLE_TTL_MS = 18000

const FinnContext = createContext(null)

// useFinn().say(category, vars) — pick a random phrase from the pool and
// display it in Finn's speech bubble for ~18s, then auto-hide. Successive
// calls replace the current message and reset the timer. `sayAssignments`
// is a convenience that picks the right singular/plural pool. `clear()`
// hides the bubble immediately.
export function useFinn() {
  const ctx = useContext(FinnContext)
  if (!ctx) {
    // Soft fallback so screens don't crash if rendered outside the
    // provider (e.g. during tests). All methods become no-ops.
    return { message: null, say: () => {}, sayAssignments: () => {}, clear: () => {} }
  }
  return ctx
}

export function FinnProvider({ children }) {
  const [message, setMessage] = useState(null)
  const timerRef = useRef(null)
  // Track last picked phrase per category to reduce immediate repeats.
  const lastByCategoryRef = useRef({})

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setMessage(null)
  }, [])

  const showText = useCallback((text) => {
    if (!text) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage({ text, at: Date.now() })
    timerRef.current = setTimeout(() => {
      setMessage(null)
      timerRef.current = null
    }, BUBBLE_TTL_MS)
  }, [])

  const say = useCallback((category, vars) => {
    // One re-roll to avoid back-to-back identical lines (e.g. two correct
    // answers picking the same "Nice one!"). Cheap, no impact on pool size.
    let text = pickPhrase(category, vars)
    const last = lastByCategoryRef.current[category]
    if (text && last && text === last) text = pickPhrase(category, vars)
    lastByCategoryRef.current[category] = text
    showText(text)
  }, [showText])

  const sayAssignments = useCallback((count, name) => {
    showText(pickAssignmentsPhrase(count, name))
  }, [showText])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return (
    <FinnContext.Provider value={{ message, say, sayAssignments, clear }}>
      {children}
    </FinnContext.Provider>
  )
}
