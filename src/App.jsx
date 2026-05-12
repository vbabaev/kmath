import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Results from './screens/Results'
import ProfilePicker from './screens/ProfilePicker'
import Profile from './screens/Profile'
import Shop from './screens/Shop'
import Login from './screens/Login'
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
  getModule,
} from './modules'
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
      return m ? { module: m, attempts: c.attempts, timeMs: c.timeMs } : null
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
  const [sessionResult, setSessionResult] = useState(null)
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
  // payload: merge into allProfiles, and if we're on the quiz screen,
  // either re-hydrate Quiz with the new state or route home if the other
  // tab finished/cancelled. Local writes do NOT route through here —
  // they update state directly and call markSeen so this hook ignores
  // the echo on the next poll.
  const applyRemoteSnapshot = useCallback(({ activeQuiz, assignments, updatedAt }) => {
    const id = activeProfileIdRef.current
    if (!id) return
    setAllProfiles((prev) => prev.map((p) =>
      p.id === id
        ? { ...p, activeQuiz: activeQuiz ?? null, assignments: assignments ?? [], updatedAt: updatedAt ?? p.updatedAt }
        : p,
    ))
    if (screenRef.current !== 'quiz') return
    if (!activeQuiz) {
      setProblems([])
      setSavedQuizState(null)
      setIsAssignmentQuiz(false)
      setSessionResult(null)
      setScreen('home')
      return
    }
    const hydrated = hydrateQuizState(activeQuiz)
    if (hydrated) {
      setProblems(hydrated.problems)
      setSavedQuizState(hydrated)
      setIsAssignmentQuiz(hydrated.isAssignment)
      setQuizRemoteKey((k) => k + 1)
    }
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
      assignments: updated.assignments ?? [],
      updatedAt: updated.updatedAt,
    })
  }, [markSeen])

  function chooseId(id) {
    setActiveProfileId(id)
    setActiveIdState(id)
  }

  const routeForProfile = useCallback((profile) => {
    const hydrated = hydrateQuizState(profile?.activeQuiz)
    if (hydrated) {
      setProblems(hydrated.problems)
      setSavedQuizState(hydrated)
      setIsAssignmentQuiz(hydrated.isAssignment)
      setSessionResult(null)
      setScreen('quiz')
    } else {
      setProblems([])
      setSavedQuizState(null)
      setIsAssignmentQuiz(false)
      setSessionResult(null)
      setScreen('home')
    }
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

        // Pick the active profile: teacher may have a saved choice; student
        // is always pinned to their primary.
        let id = getActiveProfileId()
        if (me.role !== 'teacher') id = me.profileId
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
    if (activeProfile?.activeQuiz) {
      try {
        const updated = await saveProfile({ ...activeProfile, activeQuiz: null })
        updateProfileInList(updated)
        broadcastUpdated(updated)
      } catch (err) {
        console.error('clear activeQuiz failed', err)
      }
    }
    setProblems(generatedProblems)
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
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
    startQuiz(generateProblems(countsFromProblems(problems)))
  }

  async function startAssignment() {
    if (!activeProfile) return
    const next = (activeProfile.assignments ?? [])[0]
    if (!next) return
    const generated = generateProblems(next.counts)
    try {
      const updated = await saveProfile({
        ...activeProfile,
        assignments: (activeProfile.assignments ?? []).slice(1),
        activeQuiz: null,
      })
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('startAssignment failed', err)
      return
    }
    setProblems(generated)
    setSavedQuizState(null)
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

  async function finishQuiz(result) {
    if (!activeProfile) return
    try {
      const updated = await logSession(activeProfile, result)
      updateProfileInList(updated)
      broadcastUpdated(updated)
    } catch (err) {
      console.error('finishQuiz failed', err)
    }
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setSessionResult(result)
    setScreen('results')
  }

  async function cancelQuiz(penalty) {
    if (!activeProfile) return
    try {
      const updated = await saveProfile({
        ...activeProfile,
        activeQuiz: null,
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
    routeForProfile(profile)
  }

  async function goProfile() {
    try { await refresh() } catch {}
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

  const isTeacherUser = authUser?.role === 'teacher'

  const assignableStudents = useMemo(() => {
    if (!activeProfile || activeProfile.role !== 'teacher') return []
    return allProfiles.filter((p) => p.role !== 'teacher' && p.id !== activeProfile.id)
  }, [allProfiles, activeProfile])

  const studentPackages = useMemo(
    () => allProfiles
      .filter((p) => p.role !== 'teacher')
      .map((student) => ({ student, packages: student.packages ?? [] })),
    [allProfiles],
  )

  if (screen === null) return null

  return (
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
          canCreate={isTeacherUser}
        />
      )}
      {screen === 'home' && activeProfile && (
        <Home
          activeProfile={activeProfile}
          assignableStudents={assignableStudents}
          onStart={startQuiz}
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
          onSnapshot={onQuizSnapshot}
          onFinish={finishQuiz}
          onCancel={cancelQuiz}
          onProfileClick={goProfile}
        />
      )}
      {screen === 'results' && (
        <Results
          result={sessionResult}
          onPlayAgain={playAgain}
          onHome={goHome}
        />
      )}
      {screen === 'profile' && activeProfile && (
        <Profile
          profile={activeProfile}
          canSwitch={isTeacherUser}
          canManageEmail={isTeacherUser}
          onHome={goHome}
          onSwitch={goPicker}
          onShop={goShop}
          onLogout={handleLogout}
          onSetEmail={(email) => handleSetProfileEmail(activeProfile, email)}
        />
      )}
      {screen === 'shop' && activeProfile && (
        <Shop
          profile={activeProfile}
          studentPackages={studentPackages}
          onBack={goHome}
          onBuy={handleBuyPackage}
          onToggleStatus={handleSetPackageStatus}
        />
      )}
    </div>
  )
}
