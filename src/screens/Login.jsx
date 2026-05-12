import { useEffect, useState } from 'react'
import { getAuthConfig, devLogin } from '../auth'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export default function Login({ onLoginSuccess }) {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getAuthConfig().then(setConfig)
    const params = new URLSearchParams(window.location.search)
    if (params.get('login') === 'denied') {
      setError("This Google account isn't associated with any profile. Ask the teacher to add your email to a profile.")
    }
  }, [])

  function googleLogin() {
    window.location.href = `${BASE}/auth/google`
  }

  async function pickDev(profileId) {
    setBusy(true)
    setError(null)
    try {
      await devLogin(profileId)
      onLoginSuccess()
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-3">🧮</div>
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">KMath</h1>
        <p className="text-gray-400 mb-8">Sign in to keep practicing</p>

        {config?.oauth && (
          <button
            onClick={googleLogin}
            className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 active:scale-95 transition-all rounded-2xl px-5 py-4 font-semibold text-gray-700 shadow-sm cursor-pointer flex items-center justify-center gap-3"
          >
            <span className="text-xl">🔑</span>
            <span>Sign in with Google</span>
          </button>
        )}

        {!config?.oauth && !config?.devLogin && (
          <p className="text-sm text-red-500">No login methods are configured.</p>
        )}

        {config?.devLogin && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dev login</p>
            <div className="flex flex-col gap-2">
              {['dad', 'kira', 'test'].map((id) => (
                <button
                  key={id}
                  onClick={() => pickDev(id)}
                  disabled={busy}
                  className="bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-xl px-4 py-2 font-semibold text-gray-700 cursor-pointer disabled:opacity-50"
                >
                  Log in as {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
