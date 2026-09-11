export default function PneumoraLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pneumora Logo"
    >
      {/* Left lung outline */}
      <path
        d="M28 12C22 12 14 18 12 28C10 38 12 48 16 52C18 54 22 54 24 52C26 50 28 44 28 36V12Z"
        stroke="url(#lungGrad)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right lung outline */}
      <path
        d="M36 12C42 12 50 18 52 28C54 38 52 48 48 52C46 54 42 54 40 52C38 50 36 44 36 36V12Z"
        stroke="url(#lungGrad)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trachea */}
      <path
        d="M30 8L32 12L34 8"
        stroke="url(#lungGrad)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central bronchi */}
      <line x1="32" y1="12" x2="32" y2="20" stroke="url(#lungGrad)" strokeWidth="1.5" />
      <line x1="32" y1="20" x2="24" y2="26" stroke="url(#lungGrad)" strokeWidth="1.2" />
      <line x1="32" y1="20" x2="40" y2="26" stroke="url(#lungGrad)" strokeWidth="1.2" />
      {/* Neural nodes — left lung */}
      <circle cx="18" cy="28" r="2" fill="url(#nodeGrad)" />
      <circle cx="22" cy="36" r="1.5" fill="url(#nodeGrad)" />
      <circle cx="16" cy="40" r="1.5" fill="url(#nodeGrad)" />
      <circle cx="24" cy="44" r="2" fill="url(#nodeGrad)" />
      {/* Neural nodes — right lung */}
      <circle cx="46" cy="28" r="2" fill="url(#nodeGrad)" />
      <circle cx="42" cy="36" r="1.5" fill="url(#nodeGrad)" />
      <circle cx="48" cy="40" r="1.5" fill="url(#nodeGrad)" />
      <circle cx="40" cy="44" r="2" fill="url(#nodeGrad)" />
      {/* Circuit connections — left */}
      <line x1="18" y1="28" x2="22" y2="36" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <line x1="22" y1="36" x2="16" y2="40" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <line x1="16" y1="40" x2="24" y2="44" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <line x1="24" y1="26" x2="18" y2="28" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      {/* Circuit connections — right */}
      <line x1="46" y1="28" x2="42" y2="36" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <line x1="42" y1="36" x2="48" y2="40" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <line x1="48" y1="40" x2="40" y2="44" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <line x1="40" y1="26" x2="46" y2="28" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
      <defs>
        <linearGradient id="lungGrad" x1="12" y1="8" x2="52" y2="54">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="50%" stopColor="#00bfa6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#00bfa6" />
        </radialGradient>
      </defs>
    </svg>
  );
}
