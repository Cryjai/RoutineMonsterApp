// Inline SVG logo: a tiny "routine monster" — geometric, friendly, monochrome-first.
// Uses currentColor for stroke so it adapts to dark/light mode.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      aria-label="Routine Monsters logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      data-testid="logo-app"
    >
      <defs>
        <linearGradient id="lm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(14 100% 64%)" />
          <stop offset="100%" stopColor="hsl(252 70% 70%)" />
        </linearGradient>
      </defs>
      {/* Body */}
      <path
        d="M6 18 C6 11, 11 6, 16 6 C21 6, 26 11, 26 18 L26 24 L23 22 L20 25 L16 22 L12 25 L9 22 L6 24 Z"
        fill="url(#lm-grad)"
      />
      {/* Antenna */}
      <line x1="16" y1="6" x2="16" y2="2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="2" r="1.2" fill="currentColor" />
      {/* Eyes */}
      <circle cx="12.5" cy="15" r="1.8" fill="white" />
      <circle cx="19.5" cy="15" r="1.8" fill="white" />
      <circle cx="12.7" cy="15.2" r="0.7" fill="#28181E" />
      <circle cx="19.7" cy="15.2" r="0.7" fill="#28181E" />
      {/* Smile */}
      <path d="M13.5 18.5 Q16 20.5 18.5 18.5" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={24} />
      <span className="font-display font-bold tracking-tight text-[1.05rem] leading-none">
        Routine<span className="text-primary">Monsters</span>
      </span>
    </span>
  );
}
