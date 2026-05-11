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
} from './profiles'
import { getActiveProfileId, setActiveProfileId, clearActiveProfileId } from './settings'
import { getAuthMe, logout as apiLogout } from './auth'
import {
  generateProblems,
  countsFromProblems,
  fromProblemRef,
  getModule,
} from './modules'

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

  const activeProfile = useMemo(
    () => allProfiles.find((p) => p.id === activeProfileId) ?? null,
    [allProfiles, activeProfileId],
  )

  const activeProfileRef = useRef(activeProfile)
  useEffect(() => {
    activeProfileRef.current = activeProfile
  }, [activeProfile])

  const refresh = useCallback(async () => {
    const list = await getAllProfiles()
    setAllProfiles(list)
    return list
  }, [])

  const updateProfileInList = useCallback((updated) => {
    if (!updated) return
    setAllProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

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
    } catch (err) {
      console.error('assignCustomMix failed', err)
    }
  }

  async function finishQuiz(result) {
    if (!activeProfile) return
    try {
      const updated = await logSession(activeProfile, result)
      updateProfileInList(updated)
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
      const updated = await saveProfile({ ...current, activeQuiz: snapshot }, { signal })
      updateProfileInList(updated)
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('quiz auto-save failed', err)
    }
  }, [updateProfileInList])

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
        <ProfilePicker profiles={allProfiles} onSelect={selectProfile} onLogout={handleLogout} />
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
          onHome={goHome}
          onSwitch={goPicker}
          onShop={goShop}
          onLogout={handleLogout}
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
