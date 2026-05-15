// Finn the Fennec Fox — the friendly mascot. SVG content is the user's
// original artwork; only structural changes are JSX-attribute renames
// (stroke-width → strokeWidth, text-anchor → textAnchor, etc.) and the
// <style> block kept as a string so React doesn't try to parse the CSS.

export default function FinnMascot({ className = '' }) {
  return (
    <svg
      width="100%"
      viewBox="0 0 680 600"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>Finn the Fennec Fox mascot</title>
      <desc>A friendly animated fennec fox with medium pointy ears and glasses sitting on a branch</desc>

      <style>{`
        @keyframes finn-idle-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes finn-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          94%, 97% { transform: scaleY(0.05); }
        }
        @keyframes finn-tail-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes finn-ear-wiggle-l {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-4deg); }
        }
        @keyframes finn-ear-wiggle-r {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes finn-star-twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .finn-bob { animation: finn-idle-bob 2.8s ease-in-out infinite; }
        .finn-left-eye { animation: finn-blink 4.5s ease-in-out infinite; transform-origin: 316px 275px; }
        .finn-right-eye { animation: finn-blink 4.5s ease-in-out infinite; transform-origin: 364px 275px; }
        .finn-tail { animation: finn-tail-sway 2.8s ease-in-out infinite; transform-origin: 270px 450px; }
        .finn-ear-l { animation: finn-ear-wiggle-l 2.8s ease-in-out infinite; transform-origin: 290px 220px; }
        .finn-ear-r { animation: finn-ear-wiggle-r 2.8s ease-in-out infinite; transform-origin: 390px 220px; }
        .finn-star1 { animation: finn-star-twinkle 1.8s ease-in-out infinite; }
        .finn-star2 { animation: finn-star-twinkle 2.4s ease-in-out 0.5s infinite; }
        .finn-star3 { animation: finn-star-twinkle 1.5s ease-in-out 1s infinite; }
      `}</style>

      <g className="finn-star1" transform="translate(110,140) scale(0.55)">
        <polygon points="20,0 24,14 38,14 27,22 31,36 20,28 9,36 13,22 2,14 16,14" fill="#F0C040" />
      </g>
      <g className="finn-star2" transform="translate(530,100) scale(0.45)">
        <polygon points="20,0 24,14 38,14 27,22 31,36 20,28 9,36 13,22 2,14 16,14" fill="#F0C040" />
      </g>
      <g className="finn-star3" transform="translate(555,240) scale(0.5)">
        <polygon points="20,0 24,14 38,14 27,22 31,36 20,28 9,36 13,22 2,14 16,14" fill="#F0C040" />
      </g>

      {/* Branch */}
      <rect x="170" y="490" width="340" height="20" rx="10" fill="#8B5E3C" />
      <rect x="180" y="488" width="320" height="9" rx="4" fill="#A8714A" />
      <ellipse cx="182" cy="486" rx="20" ry="11" fill="#4A8C3F" transform="rotate(-20,182,486)" />
      <ellipse cx="498" cy="486" rx="18" ry="10" fill="#4A8C3F" transform="rotate(20,498,486)" />
      <ellipse cx="210" cy="480" rx="15" ry="8" fill="#5BA050" transform="rotate(-10,210,480)" />
      <ellipse cx="470" cy="480" rx="14" ry="8" fill="#5BA050" transform="rotate(10,470,480)" />

      <g className="finn-bob">
        {/* Tail */}
        <g className="finn-tail">
          <ellipse cx="248" cy="455" rx="55" ry="28" fill="#E8934A" transform="rotate(-30,248,455)" />
          <ellipse cx="220" cy="438" rx="42" ry="22" fill="#F0A855" transform="rotate(-40,220,438)" />
          <ellipse cx="196" cy="416" rx="22" ry="16" fill="#FFF5E8" transform="rotate(-50,196,416)" />
          <ellipse cx="246" cy="453" rx="38" ry="18" fill="#F0A855" transform="rotate(-30,246,453)" />
        </g>

        {/* Body */}
        <ellipse cx="340" cy="410" rx="80" ry="90" fill="#E8934A" />
        <ellipse cx="340" cy="420" rx="52" ry="65" fill="#FFF0D8" />

        {/* Paws */}
        <ellipse cx="300" cy="486" rx="22" ry="12" fill="#E8934A" />
        <ellipse cx="380" cy="486" rx="22" ry="12" fill="#E8934A" />
        <line x1="293" y1="490" x2="293" y2="496" stroke="#D07830" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="300" y1="492" x2="300" y2="498" stroke="#D07830" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="307" y1="490" x2="307" y2="496" stroke="#D07830" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="373" y1="490" x2="373" y2="496" stroke="#D07830" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="380" y1="492" x2="380" y2="498" stroke="#D07830" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="387" y1="490" x2="387" y2="496" stroke="#D07830" strokeWidth="1.5" strokeLinecap="round" />

        {/* Neck */}
        <ellipse cx="340" cy="335" rx="42" ry="28" fill="#E8934A" />

        {/* Head */}
        <ellipse cx="340" cy="285" rx="78" ry="72" fill="#E8934A" />

        {/* Ears */}
        <g className="finn-ear-l">
          <path d="M262,252 Q240,160 278,138 Q295,170 312,238" fill="#E8934A" />
          <path d="M268,246 Q250,168 278,150 Q292,176 306,236" fill="#F5C0A0" />
        </g>
        <g className="finn-ear-r">
          <path d="M418,252 Q440,160 402,138 Q385,170 368,238" fill="#E8934A" />
          <path d="M412,246 Q430,168 402,150 Q388,176 374,236" fill="#F5C0A0" />
        </g>

        {/* Muzzle */}
        <ellipse cx="340" cy="308" rx="40" ry="36" fill="#FFF0D8" />

        {/* Eyes */}
        <ellipse cx="316" cy="278" rx="16" ry="16" fill="#FFFEF5" />
        <ellipse cx="364" cy="278" rx="16" ry="16" fill="#FFFEF5" />
        <ellipse cx="316" cy="278" rx="11" ry="11" fill="#A0580A" />
        <ellipse cx="364" cy="278" rx="11" ry="11" fill="#A0580A" />
        <g className="finn-left-eye">
          <ellipse cx="316" cy="278" rx="7" ry="8" fill="#1A0A00" />
          <circle cx="319" cy="274" r="3" fill="white" />
        </g>
        <g className="finn-right-eye">
          <ellipse cx="364" cy="278" rx="7" ry="8" fill="#1A0A00" />
          <circle cx="367" cy="274" r="3" fill="white" />
        </g>

        {/* Glasses */}
        <circle cx="316" cy="278" r="22" fill="none" stroke="#3A2A1A" strokeWidth="3" />
        <circle cx="364" cy="278" r="22" fill="none" stroke="#3A2A1A" strokeWidth="3" />
        <line x1="338" y1="278" x2="342" y2="278" stroke="#3A2A1A" strokeWidth="3" strokeLinecap="round" />
        <line x1="294" y1="272" x2="276" y2="268" stroke="#3A2A1A" strokeWidth="3" strokeLinecap="round" />
        <line x1="386" y1="272" x2="404" y2="268" stroke="#3A2A1A" strokeWidth="3" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="340" cy="306" rx="9" ry="7" fill="#3A1A0A" />
        <ellipse cx="338" cy="304" rx="3" ry="2" fill="#5A2A10" opacity="0.5" />

        {/* Smile */}
        <path d="M332,314 Q340,323 348,314" fill="none" stroke="#C06820" strokeWidth="2" strokeLinecap="round" />

        {/* Whisker dots */}
        <circle cx="310" cy="310" r="2" fill="#C07030" opacity="0.6" />
        <circle cx="302" cy="306" r="2" fill="#C07030" opacity="0.6" />
        <circle cx="370" cy="310" r="2" fill="#C07030" opacity="0.6" />
        <circle cx="378" cy="306" r="2" fill="#C07030" opacity="0.6" />
      </g>

      {/* Name */}
      <text x="340" y="578" textAnchor="middle" fontFamily="sans-serif" fontSize="18" fontWeight="500" fill="#8B5E3C">
        Finn
      </text>
    </svg>
  )
}
