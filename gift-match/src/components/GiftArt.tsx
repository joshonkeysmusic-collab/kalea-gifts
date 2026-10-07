/** Hand-drawn style gift box used on welcome & recipient reveal. */
export function GiftArt({ open = false, className = '' }: { open?: boolean; className?: string }) {
  return (
    <svg className={`gift-art ${open ? 'open' : ''} ${className}`} viewBox="0 0 240 220" aria-hidden>
      <defs>
        <linearGradient id="ga-box" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9AAE" />
          <stop offset="1" stopColor="#FF4D6D" />
        </linearGradient>
        <linearGradient id="ga-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF5D7A" />
          <stop offset="1" stopColor="#B8173F" />
        </linearGradient>
        <linearGradient id="ga-ribbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE08F" />
          <stop offset="1" stopColor="#E8A21E" />
        </linearGradient>
        <radialGradient id="ga-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FF6F8A" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FF6F8A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="200" rx="92" ry="12" fill="#000" opacity="0.5" />
      <circle className="ga-glow" cx="120" cy="96" r="90" fill="url(#ga-glow)" />
      {/* box body */}
      <rect x="40" y="96" width="160" height="102" rx="8" fill="url(#ga-side)" />
      <rect x="108" y="96" width="24" height="102" fill="url(#ga-ribbon)" />
      {/* lid */}
      <g className="ga-lid">
        <rect x="32" y="74" width="176" height="30" rx="7" fill="url(#ga-box)" />
        <rect x="106" y="74" width="28" height="30" fill="url(#ga-ribbon)" />
        <path d="M120 74c-14-26-52-34-52-12 0 14 30 14 52 12z" fill="url(#ga-ribbon)" />
        <path d="M120 74c14-26 52-34 52-12 0 14-30 14-52 12z" fill="url(#ga-ribbon)" />
        <path d="M120 74c-6 10-20 30-30 36M120 74c6 10 20 30 30 36" stroke="#E8A21E" strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="120" cy="72" r="9" fill="#FFC94A" />
      </g>
      <g className="ga-sparkles" fill="#FFC94A">
        <path d="M30 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path d="M206 28l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path d="M212 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </g>
    </svg>
  );
}
