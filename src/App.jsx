import { useEffect, useState } from 'react'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Results from './screens/Results'
import ProfilePicker from './screens/ProfilePicker'
import Profile from './screens/Profile'
import Shop from './screens/Shop'
import {
  ensureSeeded,
  getActiveProfile,
  getActiveProfileId,
  setActiveProfileId,
  updateActiveProfileSettings,
  logSessionFromResult,
  clearActiveQuiz,
  adjustActivePoints,
  addAssignmentToProfile,
  consumeActiveAssignment,
  buyPackage,
  setPackageStatus,
} from './profiles'
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

// problems: [{ module, problem }]
export default function App() {
  const [screen, setScreen] = useState(null)
  const [activeProfile, setActiveProfile] = useState(null)
  const [problems, setProblems] = useState([])
  const [savedQuizState, setSavedQuizState] = useState(null)
  const [isAssignmentQuiz, setIsAssignmentQuiz] = useState(false)
  const [sessionResult, setSessionResult] = useState(null)
  const [shopReloadKey, setShopReloadKey] = useState(0)

  function enterProfile(profile) {
    setActiveProfile(profile)
    const hydrated = hydrateQuizState(profile?.activeQuiz)
    if (hydrated) {
      setProblems(hydrated.problems)
      setSavedQuizState(hydrated)
      setIsAssignmentQuiz(hydrated.isAssignment)
      setScreen('quiz')
    } else {
      setSavedQuizState(null)
      setIsAssignmentQuiz(false)
      setScreen('home')
    }
  }

  useEffect(() => {
    ensureSeeded()
    const id = getActiveProfileId()
    if (id) {
      enterProfile(getActiveProfile())
    } else {
      setScreen('profilePicker')
    }
  }, [])

  function selectProfile(id) {
    setActiveProfileId(id)
    enterProfile(getActiveProfile())
  }

  function refreshProfile() {
    setActiveProfile(getActiveProfile())
  }

  function changeGroup(groupId) {
    updateActiveProfileSettings({ group: groupId })
    refreshProfile()
  }

  function startQuiz(generatedProblems) {
    clearActiveQuiz()
    setProblems(generatedProblems)
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setScreen('quiz')
  }

  function playAgain() {
    // If the student still has assignments queued, don't let Play Again sneak
    // a fresh regular quiz past the gate — send them back to Home where the
    // next assignment card is waiting.
    const profile = getActiveProfile()
    if ((profile?.assignments ?? []).length > 0) {
      goHome()
      return
    }
    startQuiz(generateProblems(countsFromProblems(problems)))
  }

  function startAssignment() {
    const profile = getActiveProfile()
    const next = (profile?.assignments ?? [])[0]
    if (!next) return
    const generated = generateProblems(next.counts)
    consumeActiveAssignment()
    clearActiveQuiz()
    refreshProfile()
    setProblems(generated)
    setSavedQuizState(null)
    setIsAssignmentQuiz(true)
    setScreen('quiz')
  }

  function assignCustomMix(studentId, counts) {
    addAssignmentToProfile(studentId, {
      from: activeProfile.id,
      fromName: activeProfile.name,
      counts,
      createdAt: new Date().toISOString(),
    })
  }

  function finishQuiz(result) {
    clearActiveQuiz()
    logSessionFromResult(result)
    refreshProfile()
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setSessionResult(result)
    setScreen('results')
  }

  function cancelQuiz(penalty) {
    clearActiveQuiz()
    if (penalty > 0) adjustActivePoints(-penalty)
    refreshProfile()
    setProblems([])
    setSavedQuizState(null)
    setIsAssignmentQuiz(false)
    setScreen('home')
  }

  function goHome() {
    // If there's still an in-progress quiz (e.g. coming back from Profile),
    // route into Quiz rather than letting the student sneak past the
    // assignment gate by going Profile → Home.
    const profile = getActiveProfile()
    const hydrated = hydrateQuizState(profile?.activeQuiz)
    if (hydrated) {
      setActiveProfile(profile)
      setProblems(hydrated.problems)
      setSavedQuizState(hydrated)
      setIsAssignmentQuiz(hydrated.isAssignment)
      setSessionResult(null)
      setScreen('quiz')
      return
    }
    setScreen('home')
    setProblems([])
    setSessionResult(null)
  }

  function goProfile() {
    setScreen('profile')
  }

  function goShop() {
    setShopReloadKey((k) => k + 1)
    setScreen('shop')
  }

  function goPicker() {
    setScreen('profilePicker')
  }

  function handleBuyPackage(type) {
    const result = buyPackage(activeProfile.id, type)
    if (result.ok) refreshProfile()
    return result
  }

  function handleSetPackageStatus(studentId, packageId, status) {
    setPackageStatus(studentId, packageId, status)
    setShopReloadKey((k) => k + 1)
  }

  if (screen === null) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {screen === 'profilePicker' && <ProfilePicker onSelect={selectProfile} />}
      {screen === 'home' && activeProfile && (
        <Home
          activeProfile={activeProfile}
          onStart={startQuiz}
          onAssign={(studentId, counts) => {
            assignCustomMix(studentId, counts)
          }}
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
          onHome={goHome}
          onSwitch={goPicker}
          onShop={goShop}
        />
      )}
      {screen === 'shop' && activeProfile && (
        <Shop
          profile={activeProfile}
          onBack={goHome}
          onBuy={handleBuyPackage}
          onToggleStatus={handleSetPackageStatus}
          reloadKey={shopReloadKey}
        />
      )}
    </div>
  )
}
