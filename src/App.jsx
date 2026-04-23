import { useEffect, useState } from 'react'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Results from './screens/Results'
import ProfilePicker from './screens/ProfilePicker'
import Profile from './screens/Profile'
import {
  ensureSeeded,
  getActiveProfile,
  getActiveProfileId,
  setActiveProfileId,
  updateActiveProfileSettings,
  logSessionFromResult,
  clearActiveQuiz,
  adjustActivePoints,
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
  }
}

// problems: [{ module, problem }]
export default function App() {
  const [screen, setScreen] = useState(null)
  const [activeProfile, setActiveProfile] = useState(null)
  const [problems, setProblems] = useState([])
  const [savedQuizState, setSavedQuizState] = useState(null)
  const [sessionResult, setSessionResult] = useState(null)

  function enterProfile(profile) {
    setActiveProfile(profile)
    const hydrated = hydrateQuizState(profile?.activeQuiz)
    if (hydrated) {
      setProblems(hydrated.problems)
      setSavedQuizState(hydrated)
      setScreen('quiz')
    } else {
      setSavedQuizState(null)
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
    setScreen('quiz')
  }

  function playAgain() {
    startQuiz(generateProblems(countsFromProblems(problems)))
  }

  function finishQuiz(result) {
    clearActiveQuiz()
    logSessionFromResult(result)
    refreshProfile()
    setSavedQuizState(null)
    setSessionResult(result)
    setScreen('results')
  }

  function cancelQuiz(penalty) {
    clearActiveQuiz()
    if (penalty > 0) adjustActivePoints(-penalty)
    refreshProfile()
    setProblems([])
    setSavedQuizState(null)
    setScreen('home')
  }

  function goHome() {
    setScreen('home')
    setProblems([])
    setSessionResult(null)
  }

  function goProfile() {
    setScreen('profile')
  }

  function goPicker() {
    setScreen('profilePicker')
  }

  if (screen === null) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {screen === 'profilePicker' && <ProfilePicker onSelect={selectProfile} />}
      {screen === 'home' && activeProfile && (
        <Home
          activeProfile={activeProfile}
          onStart={startQuiz}
          onGroupChange={changeGroup}
          onProfileClick={goProfile}
        />
      )}
      {screen === 'quiz' && (
        <Quiz
          problems={problems}
          initialState={savedQuizState}
          onFinish={finishQuiz}
          onCancel={cancelQuiz}
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
        <Profile profile={activeProfile} onHome={goHome} onSwitch={goPicker} />
      )}
    </div>
  )
}
