/**
 * DB Prosthetics and Orthotics Ltd — Logo mark
 * An embossed circular badge with "DB" monogram.
 */

interface Props {
  size?: number;
}

export default function DBLogo({ size = 48 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DB Prosthetics Logo"
    >
      {/* Outer ring — dark shadow bottom-right, light top-left */}
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2e6499" />
          <stop offset="50%" stopColor="#1b3d5e" />
          <stop offset="100%" stopColor="#0f2438" />
        </linearGradient>
        <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#254f7a" />
          <stop offset="100%" stopColor="#1b3d5e" />
        </linearGradient>
        <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b5751f" />
          <stop offset="100%" stopColor="#d08c2a" />
        </linearGradient>
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0a1e30" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Outer circle — embossed ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="url(#ringGrad)"
        filter="url(#logoShadow)"
      />

      {/* Inner highlight ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Inner face */}
      <circle cx="24" cy="24" r="18" fill="url(#faceGrad)" />

      {/* Gold accent arc at top */}
      <path
        d="M 10 24 A 14 14 0 0 1 38 24"
        fill="none"
        stroke="url(#accentLine)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* "DB" monogram */}
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontWeight="600"
        fontSize="14"
        fill="#f0ece4"
        letterSpacing="1"
      >
        DB
      </text>

      {/* Bottom accent dot */}
      <circle cx="24" cy="36" r="1.5" fill="url(#accentLine)" opacity="0.8" />
    </svg>
  );
}
