import { useFinn } from './FinnContext'
import FinnMascot from './FinnMascot'

// Floating Finn — pinned to the bottom-right of the viewport. The mascot
// is always visible; the speech bubble appears when `say()` is called and
// auto-hides after ~18s (FinnContext owns the timer). Clicking the bubble
// dismisses it early. Container is pointer-events-none so it never blocks
// underlying clicks; only the bubble and mascot themselves are clickable.
export default function Finn() {
  const { message, clear } = useFinn()

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 pointer-events-none flex flex-col items-end gap-2">
      {message && (
        <button
          key={message.at}
          type="button"
          onClick={clear}
          className="pointer-events-auto finn-bubble relative max-w-[240px] sm:max-w-[280px] bg-white border-2 border-amber-200 rounded-2xl shadow-xl px-4 py-3 text-gray-800 text-sm font-medium leading-snug text-left cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all"
          aria-label="Dismiss Finn's message"
        >
          {message.text}
          {/* Bubble tail — rotated square clipped to look like a triangle */}
          <span
            aria-hidden="true"
            className="absolute -bottom-[7px] right-10 w-3 h-3 bg-white border-r-2 border-b-2 border-amber-200 rotate-45"
          />
        </button>
      )}

      <div className="pointer-events-auto w-28 sm:w-36 md:w-44 select-none drop-shadow-md">
        <FinnMascot />
      </div>

      <style>{`
        @keyframes finn-bubble-in {
          0%   { opacity: 0; transform: translateY(6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .finn-bubble { animation: finn-bubble-in 220ms ease-out both; transform-origin: bottom right; }
      `}</style>
    </div>
  )
}
