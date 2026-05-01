export function ChatHero() {
  return (
    <div className="chat-hero">
      <svg viewBox="0 0 200 160" width="200" height="160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></radialGradient>
          <radialGradient id="g2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3"/><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/></radialGradient>
        </defs>
        <ellipse cx="70" cy="80" rx="55" ry="45" fill="url(#g1)" className="anim-glow-pulse"/>
        <ellipse cx="140" cy="75" rx="40" ry="35" fill="url(#g2)" className="anim-glow-pulse2"/>
        <g className="anim-float1">
          <rect x="20" y="45" width="100" height="55" rx="16" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5"/>
          <path d="M30 100 L20 115 L48 100Z" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="52" cy="72" r="5" fill="#7c3aed" className="anim-dot1"/>
          <circle cx="70" cy="72" r="5" fill="#7c3aed" className="anim-dot2"/>
          <circle cx="88" cy="72" r="5" fill="#7c3aed" className="anim-dot3"/>
        </g>
        <g className="anim-float2">
          <rect x="90" y="20" width="90" height="48" rx="14" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5"/>
          <path d="M170 68 L182 80 L155 68Z" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5" strokeLinejoin="round"/>
          <rect x="104" y="36" width="48" height="5" rx="2.5" fill="#0ea5e9" opacity="0.7"/>
          <rect x="104" y="47" width="34" height="5" rx="2.5" fill="#0ea5e9" opacity="0.4"/>
        </g>
        <g className="anim-badge">
          <circle cx="168" cy="22" r="10" fill="#7c3aed"/>
          <text x="168" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
        </g>
        <circle cx="16" cy="35" r="2.5" fill="#a78bfa" className="anim-sparkle1"/>
        <circle cx="188" cy="110" r="2" fill="#60a5fa" className="anim-sparkle2"/>
        <circle cx="155" cy="130" r="3" fill="#7c3aed" className="anim-sparkle3"/>
        <circle cx="25" cy="130" r="2" fill="#0ea5e9" className="anim-sparkle1"/>
        <g className="anim-star1" transform="translate(12,55)">
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
        <g className="anim-star2" transform="translate(190,60)">
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="-4" y1="0" x2="4" y2="0" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="-2.8" y1="-2.8" x2="2.8" y2="2.8" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="2.8" y1="-2.8" x2="-2.8" y2="2.8" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  );
}

export function EmptyChat({ isDM, partner }) {
  return (
    <div className="empty-illustration">
      <svg viewBox="0 0 160 120" width="160" height="120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="eg1" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.12"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></radialGradient>
        </defs>
        <ellipse cx="80" cy="70" rx="65" ry="45" fill="url(#eg1)" className="anim-glow-pulse"/>
        {isDM ? (
          <g>
            <g className="anim-float1">
              <circle cx="48" cy="55" r="22" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5"/>
              <text x="48" y="61" textAnchor="middle" fill="#7c3aed" fontSize="16" fontWeight="bold">{partner?.slice(0,1).toUpperCase()||"?"}</text>
            </g>
            <g className="anim-float2">
              <circle cx="112" cy="55" r="22" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5"/>
              <text x="112" y="61" textAnchor="middle" fill="#0ea5e9" fontSize="12" fontWeight="bold">You</text>
            </g>
            <g className="anim-badge" transform="translate(80,38)"><text textAnchor="middle" fontSize="14">💬</text></g>
          </g>
        ) : (
          <g>
            <g className="anim-float2">
              <rect x="12" y="28" width="60" height="36" rx="12" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5"/>
              <path d="M22 64 L14 76 L38 64Z" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="22" y="40" width="28" height="4" rx="2" fill="#0ea5e9" opacity="0.7"/>
              <rect x="22" y="50" width="20" height="4" rx="2" fill="#0ea5e9" opacity="0.4"/>
            </g>
            <g className="anim-float1">
              <rect x="68" y="18" width="72" height="42" rx="13" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5"/>
              <path d="M128 60 L140 74 L112 60Z" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="90" cy="39" r="4.5" fill="#7c3aed" className="anim-dot1"/>
              <circle cx="104" cy="39" r="4.5" fill="#7c3aed" className="anim-dot2"/>
              <circle cx="118" cy="39" r="4.5" fill="#7c3aed" className="anim-dot3"/>
            </g>
          </g>
        )}
        <circle cx="18" cy="20" r="2.5" fill="#a78bfa" className="anim-sparkle1"/>
        <circle cx="148" cy="25" r="2" fill="#60a5fa" className="anim-sparkle2"/>
        <circle cx="140" cy="95" r="2.5" fill="#7c3aed" className="anim-sparkle3"/>
        <circle cx="22" cy="95" r="2" fill="#0ea5e9" className="anim-sparkle1"/>
      </svg>
      <p className="empty-title">{isDM ? `Start chatting with ${partner}` : "No messages yet"}</p>
      <p className="empty-sub">{isDM ? "Your messages are private 🔒" : "Be the first to say hello! 👋"}</p>
    </div>
  );
}

export function ConnectingSpinner() {
  return (
    <div className="connecting-wrap">
      <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#ddd6fe" strokeWidth="3"/>
        <circle cx="22" cy="22" r="18" fill="none" stroke="#7c3aed" strokeWidth="3"
          strokeDasharray="30 84" strokeLinecap="round" className="spin"/>
      </svg>
      <span>Connecting...</span>
    </div>
  );
}
