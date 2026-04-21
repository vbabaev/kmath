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
} from './profiles'
import { generateProblems, countsFromProblems } from './modules'

// problems: [{ module, problem }]
export default function App() {
  const [screen, setScreen] = useState(null)
  const [activeProfile, setActiveProfile] = useState(null)
  const [problems, setProblems] = useState([])
  const [sessionResult, setSessionResult] = useState(null)

  useEffect(() => {
    ensureSeeded()
    const id = getActiveProfileId()
    if (id) {
      setActiveProfile(getActiveProfile())
      setScreen('home')
    } else {
      setScreen('profilePicker')
    }
  }, [])

  function selectProfile(id) {
    setActiveProfileId(id)
    setActiveProfile(getActiveProfile())
    setScreen('home')
  }

  function refreshProfile() {
    setActiveProfile(getActiveProfile())
  }

  function changeGroup(groupId) {
    updateActiveProfileSettings({ group: groupId })
    refreshProfile()
  }

  function startQuiz(generatedProblems) {
    setProblems(generatedProblems)
    setScreen('quiz')
  }

  function playAgain() {
    startQuiz(generateProblems(countsFromProblems(problems)))
  }

  function finishQuiz(result) {
    logSessionFromResult(result)
    refreshProfile()
    setSessionResult(result)
    setScreen('results')
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
      {screen === 'quiz' && <Quiz problems={problems} onFinish={finishQuiz} onHome={goHome} />}
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
