import { useState } from 'react'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Results from './screens/Results'

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'quiz' | 'results'
  const [topic, setTopic] = useState(null)
  const [sessionResult, setSessionResult] = useState(null)

  function startQuiz(selectedTopic) {
    setTopic(selectedTopic)
    setScreen('quiz')
  }

  function finishQuiz(result) {
    setSessionResult(result)
    setScreen('results')
  }

  function goHome() {
    setScreen('home')
    setTopic(null)
    setSessionResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {screen === 'home' && <Home onStart={startQuiz} />}
      {screen === 'quiz' && <Quiz topic={topic} onFinish={finishQuiz} onHome={goHome} />}
      {screen === 'results' && <Results result={sessionResult} topic={topic} onPlayAgain={() => startQuiz(topic)} onHome={goHome} />}
    </div>
  )
}
