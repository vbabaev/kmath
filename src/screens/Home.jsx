import { TOPICS } from '../data/topics'

export default function Home({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🧮</div>
          <h1 className="text-4xl font-bold text-indigo-700 mb-2">KMath</h1>
          <p className="text-gray-500 text-lg">5th Grade Math Practice</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onStart(topic)}
              className={`${topic.bgLight} ${topic.border} border-2 rounded-2xl p-5 text-left hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-sm hover:shadow-md`}
            >
              <div className="text-3xl mb-2">{topic.emoji}</div>
              <div className="font-semibold text-gray-800 text-lg">{topic.label}</div>
              <div className="text-sm text-gray-500 mt-1">{topic.description}</div>
            </button>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">Pick a topic to start earning ⭐ stars!</p>
      </div>
    </div>
  )
}
