import { useEffect, useMemo, useRef } from 'react'
import { apiGet, apiPut } from './api'

const POLL_INTERVAL_MS = 750

function channelName(profileId) {
  return `kmath:profile:${profileId}`
}

// One persistent BroadcastChannel per profile, shared by every subscriber
// in this tab. The previous implementation opened a fresh channel for each
// postMessage and closed it immediately — some browser implementations
// dropped the message before it was actually delivered.
const channelCache = new Map()
function getChannel(profileId) {
  if (typeof BroadcastChannel === 'undefined') return null
  let ch = channelCache.get(profileId)
  if (!ch) {
    try {
      ch = new BroadcastChannel(channelName(profileId))
      channelCache.set(profileId, ch)
    } catch {
      return null
    }
  }
  return ch
}

export async function getProfileSync(profileId, options) {
  return apiGet(`/profiles/${profileId}/sync`, options)
}

export async function putActiveQuiz(profileId, snapshot, options) {
  return apiPut(
    `/profiles/${profileId}/active-quiz`,
    { activeQuiz: snapshot },
    options,
  )
}

// Same-browser sibling tabs share a BroadcastChannel so a local save
// propagates within milliseconds; receivers get the full sync payload
// (no follow-up fetch needed). Cross-browser falls back to the poll.
// (BroadcastChannel does not echo a message to the sender — own-tab
// listeners on the same channel never receive their own postMessage.)
export function broadcastProfileUpdate(profileId, payload) {
  const ch = getChannel(profileId)
  if (!ch) return
  try {
    ch.postMessage(payload)
  } catch {
    // closed/unsupported — ignore
  }
}

// Subscribes the caller to live updates for one profile. onUpdate fires
// with `{ activeQuiz, assignments, updatedAt, source }` whenever a newer
// state arrives via poll or BroadcastChannel.
//
// Returns `{ markSeen(updatedAt) }` — call this after a local save so the
// hook's next poll skips the echo of your own write.
export function useProfileLiveSync(profileId, { onUpdate, pollMs = POLL_INTERVAL_MS, enabled = true } = {}) {
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const lastSeenRef = useRef(null)

  useEffect(() => {
    if (!profileId || !enabled) return undefined

    let cancelled = false
    let timer = null

    function maybeApply(payload, source) {
      if (cancelled || !payload) return
      const ts = payload.updatedAt ?? ''
      if (lastSeenRef.current && ts && ts <= lastSeenRef.current) return
      if (ts) lastSeenRef.current = ts
      onUpdateRef.current?.({ ...payload, source })
    }

    async function poll() {
      if (cancelled || (typeof document !== 'undefined' && document.hidden)) return
      try {
        const payload = await getProfileSync(profileId)
        maybeApply(payload, 'poll')
      } catch {
        // transient errors are ignored; the next poll retries
      }
    }

    poll()
    timer = setInterval(poll, pollMs)

    const ch = getChannel(profileId)
    const onMessage = (e) => maybeApply(e.data, 'broadcast')
    if (ch) ch.addEventListener('message', onMessage)

    function onVisibility() {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      if (ch) ch.removeEventListener('message', onMessage)
      document.removeEventListener('visibilitychange', onVisibility)
      lastSeenRef.current = null
    }
  }, [profileId, enabled, pollMs])

  return useMemo(
    () => ({
      markSeen(ts) {
        if (ts && (!lastSeenRef.current || ts > lastSeenRef.current)) {
          lastSeenRef.current = ts
        }
      },
    }),
    [],
  )
}
