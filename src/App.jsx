import { useState } from 'react'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Results from './screens/Results'

// problems: [{ module, problem }]
export default function App() {
  const [screen, setScreen] = useState('home')
  const [problems, setProblems] = useState([])
  const [sessionResult, setSessionResult] = useState(null)

  function startQuiz(generatedProblems) {
    setProblems(generatedProblems)
    setScreen('quiz')
  }

  function finishQuiz(result) {
    setSessionResult(result)
    setScreen('results')
  }

  function goHome() {
    setScreen('home')
    setProblems([])
    setSessionResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {screen === 'home' && <Home onStart={startQuiz} />}
      {screen === 'quiz' && <Quiz problems={problems} onFinish={finishQuiz} onHome={goHome} />}
      {screen === 'results' && <Results result={sessionResult} onPlayAgain={() => startQuiz(problems)} onHome={goHome} />}
    </div>
  )
}
