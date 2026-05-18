import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Results from './screens/Results'
import ProfilePicker from './screens/ProfilePicker'
import Profile from './screens/Profile'
import Shop from './screens/Shop'
import Login from './screens/Login'
import MoodPicker from './screens/MoodPicker'
import SessionDetail from './screens/SessionDetail'
import {
  getAllProfiles,
  saveProfile,
  buyPackage,
  setPackageStatus,
  addAssignment,
  popFirstAssignment,
  logSession,
  createProfile,
  setProfileEmail,
} from './profiles'
import { getActiveProfileId, setActiveProfileId, clearActiveProfileId } from './settings'
import { getAuthMe, logout as apiLogout } from './auth'
import {
  generateProblems,
  countsFromProblems,
  fromProblemRef,
  toProblemRef,
  getModule,
} from './modules'
import { FinnProvider } from './finn/FinnContext'
import Finn from './finn/Finn'

// Screens that participate in the synced "flow" — when the server says
// another tab/device has moved within this set, we follow. Other screens
// (Profile, Shop, Picker, Login) are user-driven and don't auto-route.
const FLOW_SCREENS = new Set(['home', 'quiz', 'results'])

function freshQuizSnapshot(problems, { isAssignment = false, isInfinite = false } = {}) {
  const refs = problems.map(toProblemRef)
  return {
    problems: refs,
    queue: refs.slice(),
    index: 0,
    score: 0,
    streak: 0,
    problemAttempts: 0,
    totalAttempts: 0,
    completedProblems: [],
    isAssignment: !!isAssignment,
    isInfinite: !!isInfinite,
  }
}

function hydrateLastResult(saved) {
  if (!saved) return null
  const completedProblems = (saved.completedProblems ?? [])
    .map((c) => {
      const m = getModule(c.moduleId)
      return m ? { module: m, problem: c.problem, attempts: c.attempts, timeMs: c.timeMs } : null
    })
    .filter(Boolean)
  if (!completedProblems.length) return null
  return {
    score: saved.score ?? 0,
    totalAttempts: saved.totalAttempts ?? 0,
    initialCount: saved.initialCount ?? completedProblems.length,
    completedProblems,
  }
}
import {
  putActiveQuiz,
  broadcastProfileUpdate,
  useProfileLiveSync,
  getProfileSync,
} from './sync'
import { ApiError } from './api'

function hydrateQuizState(saved) {
  if (!saved) return null
  const problems = (saved.problems ?? []).map(fromProblemRef).filter(Boolean)
  const queue = (saved.queue ?? []).map(fromProblemRef).filter(Boolean)
  const completedProblems = (saved.completedProblems ?? [])
    .map((c) => {
      const m = getModule(c.moduleId)
      return m ? { module: m, problem: c.problem, attempts: c.attempts, timeMs: c.timeMs } : null
    })
    .filter(Boolean)
  if (!problems.length || !queue.length) return null
  return {
    problems,
    queue,
    completedProblems,
    index: saved.index ?? 0,
    score: saved.score ?? 0,
    streak: saved.streak ?? 0,
    problemAttempts: saved.problemAttempts ?? 0,
    totalAttempts: saved.totalAttempts ?? 0,
    isAssignment: !!saved.isAssignment,
    isInfinite: !!saved.isInfinite,
  }
}

export default function App() {
  const [screen, setScreen] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [activeProfileId, setActiveIdState] = useState(() => getActiveProfileId())
  const [problems, setProblems] = useState([])
  const [savedQuizState, setSavedQuizState] = useState(null)
  const [isAssignmentQuiz, setIsAssignmentQuiz] = useState(false)
  const [isInfiniteQuiz, setIsInfiniteQuiz] = useState(false)
  const [sessionResult, setSessionResult] = useState(null)
  // Mood flow (assignments only). `pendingAssignment` carries the popped
  // assignment + freshly-generated problems from start → mood-start →
  // Quiz. `pendingFinish` carries the Quiz result from finish → mood-end
  // → logSession. `assignmentMoodStart` is the mood captured before the
  // quiz, held in App state until logSession folds it into the session
  // entry. None of these are persisted on `activeQuiz` — F5 on a mood
  // screen drops the kid back into Quiz (mood-end) or back to Home
  // (mood-start), which is the documented behavior.
  const [pendingAssignment, setPendingAssignment] = useState(null)
  const [assignmentMoodStart, setAssignmentMoodStart] = useState(null)
  const [pendingFinish, setPendingFinish] = useState(null)
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(null)
  // Bumped whenever a remote update (poll or BroadcastChannel) brings a
  // newer activeQuiz than what the local Quiz instance is showing. Quiz
  // uses this as its `key` so it remounts and re-hydrates from server state.
  const [quizRemoteKey, setQuizRemoteKey] = useState(0)
  const screenRef = useRef(null)

  const activeProfile = useMemo(
    () => allProfiles.find((p) => p.id === activeProfileId) ?? null,
    [allProfiles, activeProfileId],
  )

  const activeProfileRef = useRef(activeProfile)
  useEffect(() => {
    activeProfileRef.current = activeProfile
  }, [activeProfile])

  const activeProfileIdRef = useRef(activeProfileId)
  useEffect(() => {
    activeProfileIdRef.current = activeProfileId
  }, [activeProfileId])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  const refresh = useCallback(async () => {
    const list = await getAllProfiles()
    setAllProfiles(list)
    return list
  }, [])

  const updateProfileInList = useCallback((updated) => {
    if (!updated) return
    setAllProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  // Apply an externally-sourced (poll, broadcast, or 409 refetch) sync
  // payload: merge into allProfiles, then mirror the screen state of
  // whichever tab/device authored the change. Only mirrors across the
  // flow screens (home, quiz, results) — if the user is on Profile or
  // Shop, leave them where they are. Local writes do NOT route through
  // here; they update state directly and call markSeen so this hook
  // ignores the echo on the next poll.
  const applyRemoteSnapshot = useCallback(({ activeQuiz, assignments, lastResult, updatedAt }) => {
    const id = activeProfileIdRef.current
    if (!id) return
    setAllProfiles((prev) => prev.map((p) =>
      p.id === id
        ? {
            ...p,
            activeQuiz: activeQuiz ?? null,
            lastResult: lastResult ?? null,
            assignments: assignments ?? [],
            updatedAt: updatedAt ?? p.updatedAt,
          }
        : p,
    ))
    if (!FLOW_SCREENS.has(screenRef.current)) return

    if (activeQuiz) {
      const hydrated = hydrateQuizState(activeQuiz)
      if (hydrated) {
        setProblems(hydrated.problems)
        setSavedQuizState(hydrated)
        setIsAssignmentQuiz(hydrated.isAssignment)
        setIsInfiniteQuiz(hydrated.isInfinite)
        setSessionResult(null)
        setQuizRemoteKey((k) => k + 1)
        setScreen('quiz')
      }
      return
    }
    if (lastResult) {
      const hydrated = hydrateLastResult(lastResult)
      if (hydrated) {
        setProblems([])
        setSavedQuizState(null)
        setIsAssignmentQuiz(false)
        setIsInfiniteQuiz(false)
        setSessionResult(hydrated)
        setScreen('results')
      }
      return
    }
    setProblems([])
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setIsInfiniteQuiz(false)
    setSessionResult(null)
    setScreen('home')
  }, [])

  const { markSeen } = useProfileLiveSync(activeProfileId, {
    enabled: !!activeProfileId,
    onUpdate: applyRemoteSnapshot,
  })

  // Helper for the non-quiz save paths (group change, start, cancel,
  // finish, assignment add/remove). Broadcasts the live-sync payload to
  // sibling tabs and marks the new updatedAt as seen so our own next poll
  // doesn't re-apply this write.
  const broadcastUpdated = useCallback((updated) => {
    if (!updated?.id) return
    if (updated.id === activeProfileIdRef.current) markSeen(updated.updatedAt)
    broadcastProfileUpdate(updated.id, {
      activeQuiz: updated.activeQuiz ?? null,
      lastResult: updated.lastResult ?? null,
      assignments: updated.assignments ?? [],
      updatedAt: updated.updatedAt,
    })
  }, [markSeen])

  function chooseId(id) {
    setActiveProfileId(id)
    setActiveIdState(id)
  }

  const routeForProfile = useCallback((profile) => {
    const aq = hydrateQuizState(profile?.activeQuiz)
    if (aq) {
      setProblems(aq.problems)
      setSavedQuizState(aq)
      setIsAssignmentQuiz(aq.isAssignment)
      setIsInfiniteQuiz(aq.isInfinite)
      setSessionResult(null)
      setScreen('quiz')
      return
    }
    const lr = hydrateLastResult(profile?.lastResult)
    if (lr) {
      setProblems([])
      setSavedQuizState(null)
      setIsAssignmentQuiz(false)
      setIsInfiniteQuiz(false)
      setSessionResult(lr)
      setScreen('results')
      return
    }
    setProblems([])
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setIsInfiniteQuiz(false)
    setSessionResult(null)
    setScreen('home')
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await getAuthMe()
        if (cancelled) return
        if (!me) {
          setScreen('login')
          return
        }
        setAuthUser(me)
        const list = await getAllProfiles()
        if (cancelled) return
        setAllProfiles(list)

        // Pick the active profile: adults (owner/parent) may have a saved
        // choice; children are always pinned to their primary.
        let id = getActiveProfileId()
        const meIsAdult = me.role === 'owner' || me.role === 'parent'
        if (!meIsAdult) id = me.profileId
        if (!id || !list.find((p) => p.id === id)) id = me.profileId
        chooseId(id)

        const profile = list.find((p) => p.id === id)
        if (!profile) {
          setScreen('profilePicker')
          return
        }
        routeForProfile(profile)
      } catch (err) {
        console.error('Bootstrap failed', err)
        if (!cancelled) setScreen('login')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [routeForProfile])

  async function selectProfile(id) {
    chooseId(id)
    let list = allProfiles
    if (!list.find((p) => p.id === id)) {
      list = await refresh()
    }
    const profile = list.find((p) => p.id === id)
    if (profile) routeForProfile(profile)
  }

  async function changeGroup(groupId) {
    if (!activeProfile) return
    try {
      const updated = await saveProfile({
        ...activeProfile,
        settings: { ...(activeProfile.settings ?? {}), group: groupId },
      })
      updateProfileInList(updated)
    } catch (err) {
      console.error('changeGroup failed', err)
    }
  }

  async function startQuiz(generatedProblems) {
    if (!activeProfile) return
    // Write the initial snapshot (and clear any stale lastResult from a
    // previous session) in a SINGLE PUT so sibling tabs don't briefly see
    // a "Home" state between Results → Quiz on a "Play Again".
    const snapshot = freshQuizSnapshot(generatedProblems)
    try {
      const updated = await saveProfile({
        ...activeProfile,
        activeQuiz: snapshot,
        lastResult: null,
      })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('startQuiz failed', err)
      return
    }
    setProblems(generatedProblems)
    setSavedQuizState(hydrateQuizState(snapshot))
    setIsAssignmentQuiz(false)
    setIsInfiniteQuiz(false)
    setSessionResult(null)
    setScreen('quiz')
  }

  // Endless practice mode — refuses to start while assignments are
  // queued (those have to be cleared first, same rule as Quick Quiz /
  // Custom Mix). Seeds the queue with a single random problem from the
  // active group; Quiz extends the queue on every correct answer.
  async function startInfinite() {
    if (!activeProfile) return
    if ((activeProfile.assignments ?? []).length > 0) return
    const groupId = activeProfile.settings?.group
    const groupModules = getModulesByGroup(groupId)
    if (groupModules.length === 0) return
    const mod = groupModules[Math.floor(Math.random() * groupModules.length)]
    const seed = [{ module: mod, problem: mod.generate() }]
    const snapshot = freshQuizSnapshot(seed, { isInfinite: true })
    try {
      const updated = await saveProfile({
        ...activeProfile,
        activeQuiz: snapshot,
        lastResult: null,
      })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('startInfinite failed', err)
      return
    }
    setProblems(seed)
    setSavedQuizState(hydrateQuizState(snapshot))
    setIsAssignmentQuiz(false)
    setIsInfiniteQuiz(true)
    setSessionResult(null)
    setScreen('quiz')
  }

  async function playAgain() {
    const list = await refresh()
    const profile = list.find((p) => p.id === activeProfileId)
    if ((profile?.assignments ?? []).length > 0) {
      routeForProfile(profile)
      return
    }
    // Infinite sessions don't have a meaningful "same queue" to reuse —
    // Play Again just kicks off a fresh infinite run.
    if (sessionResult?.isInfinite) {
      startInfinite()
      return
    }
    // sessionResult.completedProblems is the canonical "last quiz's
    // shape" — it's set both for the original finisher (from finishQuiz)
    // and for sibling tabs (rehydrated from server lastResult via
    // applyRemoteSnapshot). `problems` is only populated on the original
    // finisher, so prefer sessionResult.
    const source = sessionResult?.completedProblems ?? problems
    startQuiz(generateProblems(countsFromProblems(source)))
  }

  // Step 1 of the assignment flow: pop the assignment, pre-generate
  // problems (held in App state — NOT yet written as activeQuiz), then
  // route to the mood-start screen. The actual quiz starts only after
  // the kid picks a mood; see `onMoodStartPicked` below.
  async function startAssignment() {
    if (!activeProfile) return
    const next = (activeProfile.assignments ?? [])[0]
    if (!next) return
    const generated = generateProblems(next.counts)
    setPendingAssignment({ assignment: next, problems: generated })
    setAssignmentMoodStart(null)
    setPendingFinish(null)
    setScreen('mood-start')
  }

  // Step 2: mood picked → actually write the activeQuiz snapshot, pop the
  // assignment from the queue, and route to Quiz. We do the assignment
  // pop here (not in step 1) so an F5 on the mood-start screen leaves the
  // queue intact — the kid can re-tap "Start Assignment" and get the
  // mood prompt again.
  async function onMoodStartPicked(mood) {
    if (!activeProfile || !pendingAssignment) {
      setScreen('home')
      return
    }
    const { problems: generated } = pendingAssignment
    const snapshot = freshQuizSnapshot(generated, { isAssignment: true })
    try {
      const updated = await saveProfile({
        ...activeProfile,
        assignments: (activeProfile.assignments ?? []).slice(1),
        activeQuiz: snapshot,
        lastResult: null,
      })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('onMoodStartPicked failed', err)
      return
    }
    setAssignmentMoodStart(mood)
    setPendingAssignment(null)
    setProblems(generated)
    setSavedQuizState(hydrateQuizState(snapshot))
    setIsAssignmentQuiz(true)
    setSessionResult(null)
    setScreen('quiz')
  }

  async function assignCustomMix(studentId, counts) {
    if (!activeProfile) return
    const student = allProfiles.find((p) => p.id === studentId)
    if (!student) return
    try {
      const updated = await addAssignment(student, {
        from: activeProfile.id,
        fromName: activeProfile.name,
        counts,
        createdAt: new Date().toISOString(),
      })
      updateProfileInList(updated)
      // Broadcasts on the STUDENT's channel so any of the student's tabs
      // in the same browser see the new assignment immediately.
      broadcastUpdated(updated)
    } catch (err) {
      console.error('assignCustomMix failed', err)
    }
  }

  // For assignments we defer the session log + Results route until
  // mood-end is picked. For Quick Quiz / Custom Mix we go straight to
  // Results without a mood prompt.
  async function finishQuiz(result) {
    if (!activeProfile) return
    if (isAssignmentQuiz) {
      setPendingFinish(result)
      setScreen('mood-end')
      return
    }
    try {
      const updated = await logSession(activeProfile, result, isInfiniteQuiz ? { isInfinite: true } : {})
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('finishQuiz failed', err)
    }
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    // sessionResult carries the isInfinite flag forward so Play Again
    // restarts in the right mode (Results doesn't know about modes).
    const finalResult = isInfiniteQuiz ? { ...result, isInfinite: true } : result
    setIsInfiniteQuiz(false)
    setSessionResult(finalResult)
    setScreen('results')
  }

  // Mood-end handler — fold both mood values into the session, log it,
  // then route to Results. If the kid F5s on this screen `pendingFinish`
  // is empty on remount; the still-present activeQuiz puts them back on
  // the last problem of the quiz and they re-finish.
  async function onMoodEndPicked(mood) {
    if (!activeProfile || !pendingFinish) {
      setScreen('home')
      return
    }
    const result = pendingFinish
    try {
      const updated = await logSession(activeProfile, result, {
        isAssignment: true,
        moodStart: assignmentMoodStart ?? undefined,
        moodEnd: mood,
      })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('onMoodEndPicked failed', err)
    }
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setSessionResult(result)
    setPendingFinish(null)
    setAssignmentMoodStart(null)
    setScreen('results')
  }

  async function cancelQuiz(penalty) {
    if (!activeProfile) return
    try {
      const updated = await saveProfile({
        ...activeProfile,
        activeQuiz: null,
        lastResult: null,
        points: Math.max(0, (activeProfile.points ?? 0) - penalty),
      })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('cancelQuiz failed', err)
    }
    setProblems([])
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setIsInfiniteQuiz(false)
    setSessionResult(null)
    setScreen('home')
  }

  // "Home" button on the Results screen. Distinct from goHome — this
  // one explicitly clears lastResult on the server so sibling tabs that
  // are also viewing Results follow back to Home with us.
  async function dismissResults() {
    if (!activeProfile) {
      setScreen('home')
      return
    }
    try {
      const updated = await saveProfile({ ...activeProfile, lastResult: null })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('dismissResults failed', err)
    }
    setProblems([])
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setIsInfiniteQuiz(false)
    setSessionResult(null)
    setScreen('home')
  }

  async function goHome() {
    let profile = activeProfile
    try {
      const list = await refresh()
      profile = list.find((p) => p.id === activeProfileId) ?? profile
    } catch {
      // fall through
    }
    // Cancel any in-flight mood flow when explicitly going Home — the
    // user has navigated away (e.g. via Profile button on mood-start).
    setPendingAssignment(null)
    setAssignmentMoodStart(null)
    setPendingFinish(null)
    setSelectedSessionIdx(null)
    routeForProfile(profile)
  }

  async function goProfile() {
    try { await refresh() } catch {}
    setSelectedSessionIdx(null)
    setScreen('profile')
  }

  function viewSession(idx) {
    setSelectedSessionIdx(idx)
    setScreen('sessionDetail')
  }

  function backToProfile() {
    setSelectedSessionIdx(null)
    setScreen('profile')
  }

  async function goShop() {
    try { await refresh() } catch {}
    setScreen('shop')
  }

  function goPicker() {
    setScreen('profilePicker')
  }

  async function handleBuyPackage(type) {
    if (!activeProfile) return { ok: false, error: 'No active profile' }
    const result = await buyPackage(activeProfile, type)
    if (result.ok) updateProfileInList(result.profile)
    return result
  }

  async function handleSetPackageStatus(studentId, packageId, status) {
    const student = allProfiles.find((p) => p.id === studentId)
    if (!student) return
    try {
      const updated = await setPackageStatus(student, packageId, status)
      updateProfileInList(updated)
    } catch (err) {
      console.error('handleSetPackageStatus failed', err)
    }
  }

  async function handleCreateProfile(data) {
    const created = await createProfile(data)
    setAllProfiles((prev) => [...prev, created])
    return created
  }

  async function handleSetProfileEmail(profile, email) {
    const updated = await setProfileEmail(profile, email)
    updateProfileInList(updated)
    return updated
  }

  async function handleLogout() {
    try {
      await apiLogout()
    } catch (err) {
      console.error('logout failed', err)
    }
    clearActiveProfileId()
    window.location.href = '/'
  }

  const onQuizSnapshot = useCallback(async (snapshot, signal) => {
    const current = activeProfileRef.current
    if (!current) return
    try {
      const { activeQuiz, updatedAt } = await putActiveQuiz(current.id, snapshot, { signal })
      markSeen(updatedAt)
      updateProfileInList({ ...current, activeQuiz, updatedAt })
      broadcastProfileUpdate(current.id, {
        activeQuiz,
        lastResult: current.lastResult ?? null,
        assignments: current.assignments ?? [],
        updatedAt,
      })
    } catch (err) {
      if (err?.name === 'AbortError') return
      if (err instanceof ApiError && err.status === 409) {
        // Another tab (or device) advanced past us. Adopt the server's state.
        try {
          const fresh = await getProfileSync(current.id)
          markSeen(fresh.updatedAt)
          applyRemoteSnapshot({ ...fresh, source: 'conflict' })
        } catch (e) {
          console.error('conflict refetch failed', e)
        }
        return
      }
      console.error('activeQuiz save failed', err)
    }
  }, [updateProfileInList, markSeen, applyRemoteSnapshot])

  const isAdultUser = authUser?.role === 'owner' || authUser?.role === 'parent'
  const isOwnerUser = authUser?.role === 'owner'

  const assignableStudents = useMemo(() => {
    if (!activeProfile) return []
    const activeIsAdult = activeProfile.role === 'owner' || activeProfile.role === 'parent'
    if (!activeIsAdult) return []
    // GET /api/profiles already filters out other adults for the requesting
    // adult — `allProfiles` is self + children at this point. We include
    // the adult themselves so they can self-assign for testing.
    return allProfiles.filter((p) => p.role === 'child' || p.id === activeProfile.id)
  }, [allProfiles, activeProfile])

  const studentPackages = useMemo(
    () => allProfiles
      .filter((p) => p.role === 'child')
      .map((student) => ({ student, packages: student.packages ?? [] })),
    [allProfiles],
  )

  if (screen === null) return null

  return (
    <FinnProvider>
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {screen === 'login' && (
        <Login onLoginSuccess={() => { window.location.href = '/' }} />
      )}
      {screen === 'profilePicker' && (
        <ProfilePicker
          profiles={allProfiles}
          onSelect={selectProfile}
          onLogout={handleLogout}
          onCreate={handleCreateProfile}
          canCreate={isAdultUser}
          canInviteParent={isOwnerUser}
        />
      )}
      {screen === 'home' && activeProfile && (
        <Home
          activeProfile={activeProfile}
          assignableStudents={assignableStudents}
          onStart={startQuiz}
          onStartInfinite={startInfinite}
          onAssign={assignCustomMix}
          onStartAssignment={startAssignment}
          onGroupChange={changeGroup}
          onProfileClick={goProfile}
          onShopClick={goShop}
        />
      )}
      {screen === 'quiz' && (
        <Quiz
          key={quizRemoteKey}
          problems={problems}
          activeProfile={activeProfile}
          initialState={savedQuizState}
          isAssignment={isAssignmentQuiz}
          isInfinite={isInfiniteQuiz}
          onSnapshot={onQuizSnapshot}
          onFinish={finishQuiz}
          onCancel={cancelQuiz}
          onProfileClick={goProfile}
        />
      )}
      {screen === 'results' && (
        <Results
          result={sessionResult}
          profileName={activeProfile?.name}
          onPlayAgain={playAgain}
          onHome={dismissResults}
        />
      )}
      {screen === 'mood-start' && activeProfile && (
        <MoodPicker
          title={`How are you feeling, ${activeProfile.name}?`}
          subtitle={`Let's check in before you start ${pendingAssignment?.assignment?.fromName ?? 'your teacher'}'s assignment.`}
          bubbleCategory="moodStart"
          profileName={activeProfile.name}
          onPick={onMoodStartPicked}
        />
      )}
      {screen === 'mood-end' && activeProfile && (
        <MoodPicker
          title="How are you feeling now?"
          subtitle="One last check-in before we show you the results."
          bubbleCategory="moodEnd"
          profileName={activeProfile.name}
          onPick={onMoodEndPicked}
        />
      )}
      {screen === 'profile' && activeProfile && (
        <Profile
          profile={activeProfile}
          canSwitch={isAdultUser}
          canManageEmail={isAdultUser}
          showHousehold={isAdultUser}
          onHome={goHome}
          onSwitch={goPicker}
          onShop={goShop}
          onLogout={handleLogout}
          onSetEmail={(email) => handleSetProfileEmail(activeProfile, email)}
          onViewSession={viewSession}
        />
      )}
      {screen === 'sessionDetail' && activeProfile && selectedSessionIdx !== null && (
        <SessionDetail
          profile={activeProfile}
          sessionIdx={selectedSessionIdx}
          onBack={backToProfile}
        />
      )}
      {screen === 'shop' && activeProfile && (
        <Shop
          profile={activeProfile}
          studentPackages={studentPackages}
          onBack={goHome}
          onBuy={handleBuyPackage}
          onToggleStatus={handleSetPackageStatus}
          onProfileClick={goProfile}
        />
      )}
      <Finn />
    </div>
    </FinnProvider>
  )
}
