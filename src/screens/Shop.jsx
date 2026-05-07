import { useMemo, useState } from 'react'
import {
  SHOP_PACKAGES,
  isTeacher,
  getAllStudentPackages,
  getProfileColors,
} from '../profiles'

const PACKAGE_ORDER = ['15min', '60min']

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function ConfirmModal({ pkg, balance, onConfirm, onCancel }) {
  const afterBalance = balance - pkg.cost
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{pkg.emoji}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Buy {pkg.label}?</h2>
          <p className="text-sm text-gray-500">
            This will cost <span className="font-bold text-indigo-600">{pkg.cost} ⭐</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Balance after: {afterBalance} ⭐
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-2xl cursor-pointer"
          >
            Buy it!
          </button>
        </div>
      </div>
    </div>
  )
}

function BuyCard({ pkg, balance, onClick }) {
  const canAfford = balance >= pkg.cost
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      className={`w-full rounded-3xl p-5 border-2 transition-all cursor-pointer text-left
        ${canAfford
          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100 active:scale-[0.98]'
          : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-5xl">{pkg.emoji}</div>
        <div className="flex-1">
          <div className="font-bold text-gray-800 text-lg">{pkg.label}</div>
          <div className="text-sm text-gray-500">{pkg.minutes} min of iPad time</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-indigo-600 text-lg">{pkg.cost} ⭐</div>
          {!canAfford && (
            <div className="text-xs text-gray-400 mt-0.5">Need {pkg.cost - balance} more</div>
          )}
        </div>
      </div>
    </button>
  )
}

function StudentPackageRow({ pkg }) {
  const isUsed = pkg.status === 'used'
  return (
    <div
      className={`rounded-2xl px-4 py-3 border-2 flex items-center gap-3 ${
        isUsed
          ? 'bg-gray-50 border-gray-200 opacity-70'
          : 'bg-emerald-50 border-emerald-200'
      }`}
    >
      <div className="text-2xl">{pkg.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${isUsed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
          {pkg.label}
        </div>
        <div className="text-xs text-gray-400">
          Bought {formatDate(pkg.createdAt)}
          {isUsed && pkg.usedAt ? ` · Used ${formatDate(pkg.usedAt)}` : ''}
        </div>
      </div>
      <div
        className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
          isUsed ? 'bg-gray-200 text-gray-500' : 'bg-emerald-200 text-emerald-800'
        }`}
      >
        {isUsed ? 'Used' : 'Active'}
      </div>
    </div>
  )
}

function StudentShop({ profile, onBack, onBuy }) {
  const [pending, setPending] = useState(null) // package type awaiting confirmation
  const [toast, setToast] = useState(null)
  const balance = profile.points ?? 0
  const packages = useMemo(
    () => [...(profile.packages ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [profile.packages]
  )

  function confirm() {
    const type = pending
    setPending(null)
    const result = onBuy(type)
    if (result?.ok) {
      setToast(`✓ ${SHOP_PACKAGES[type].label} bought!`)
      setTimeout(() => setToast(null), 2500)
    } else if (result?.error) {
      setToast(`⚠️ ${result.error}`)
      setTimeout(() => setToast(null), 2500)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white font-semibold px-5 py-3 rounded-full shadow-lg z-50 animate-[bounce_0.4s_ease-out]">
          {toast}
        </div>
      )}
      {pending && (
        <ConfirmModal
          pkg={SHOP_PACKAGES[pending]}
          balance={balance}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}

      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
            ← Home
          </button>
          <div className="text-sm text-gray-500">
            <span className="font-bold text-indigo-600">{balance}</span> ⭐
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl mb-2">🛍️</div>
          <h1 className="text-3xl font-bold text-indigo-700 mb-1">Shop</h1>
          <p className="text-gray-400 text-sm">Spend your stars on iPad time</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {PACKAGE_ORDER.map((type) => (
            <BuyCard
              key={type}
              pkg={SHOP_PACKAGES[type]}
              balance={balance}
              onClick={() => setPending(type)}
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Your packages
          </h3>
          {packages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">
              You haven't bought any packages yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {packages.map((pkg) => (
                <StudentPackageRow key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeacherPackageRow({ pkg, studentColors, onToggle }) {
  const isUsed = pkg.status === 'used'
  return (
    <div
      className={`rounded-2xl px-4 py-3 border-2 flex items-center gap-3 ${
        isUsed ? 'bg-gray-50 border-gray-200' : `${studentColors.bgLight} ${studentColors.border}`
      }`}
    >
      <div className="text-2xl">{pkg.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-800">{pkg.label}</div>
        <div className="text-xs text-gray-400">
          Bought {formatDate(pkg.createdAt)}
          {isUsed && pkg.usedAt ? ` · Used ${formatDate(pkg.usedAt)}` : ''}
        </div>
      </div>
      <button
        onClick={onToggle}
        className="text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 transition-all text-gray-700 px-3 py-2 rounded-xl cursor-pointer whitespace-nowrap"
      >
        {isUsed ? 'Restore' : 'Mark used'}
      </button>
    </div>
  )
}

function TeacherShop({ onBack, onToggle, reloadKey }) {
  const [tab, setTab] = useState('active')
  const data = useMemo(() => getAllStudentPackages(), [reloadKey])
  const visible = data
    .map(({ student, packages }) => ({
      student,
      packages: packages
        .filter((p) => p.status === tab)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .filter(({ packages }) => packages.length > 0)

  const totalActive = data.reduce(
    (sum, { packages }) => sum + packages.filter((p) => p.status === 'active').length,
    0
  )
  const totalUsed = data.reduce(
    (sum, { packages }) => sum + packages.filter((p) => p.status === 'used').length,
    0
  )

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
            ← Home
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl mb-2">🛍️</div>
          <h1 className="text-3xl font-bold text-indigo-700 mb-1">Shop</h1>
          <p className="text-gray-400 text-sm">Packages bought by students</p>
        </div>

        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-100">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'active' ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active {totalActive > 0 && <span className="ml-1 opacity-80">({totalActive})</span>}
          </button>
          <button
            onClick={() => setTab('used')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'used' ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Used {totalUsed > 0 && <span className="ml-1 opacity-80">({totalUsed})</span>}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl px-6 py-10 text-center">
            <div className="text-4xl mb-2">✨</div>
            <div className="font-semibold text-gray-700">
              No {tab} packages
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {tab === 'active'
                ? "Students haven't bought anything yet"
                : 'Mark active packages as used to see them here'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {visible.map(({ student, packages }) => {
              const c = getProfileColors(student.color)
              return (
                <div key={student.id}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xl">{student.emoji}</span>
                    <span className={`text-sm font-bold ${c.text}`}>{student.name}</span>
                    <span className="text-xs text-gray-400">· {packages.length}</span>
                    <div className="flex-1 h-px bg-gray-200 ml-1" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {packages.map((pkg) => (
                      <TeacherPackageRow
                        key={pkg.id}
                        pkg={pkg}
                        studentColors={c}
                        onToggle={() =>
                          onToggle(student.id, pkg.id, pkg.status === 'active' ? 'used' : 'active')
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Shop({ profile, onBack, onBuy, onToggleStatus, reloadKey }) {
  if (isTeacher(profile)) {
    return <TeacherShop onBack={onBack} onToggle={onToggleStatus} reloadKey={reloadKey} />
  }
  return <StudentShop profile={profile} onBack={onBack} onBuy={onBuy} />
}
