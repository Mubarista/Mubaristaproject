export function MtnMomoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MomoPay"
    >
      <rect width="48" height="32" rx="4" fill="#FFC107" />
      <rect x="12" y="4" width="24" height="24" rx="3" fill="#212121" />
      <text
        x="24"
        y="19"
        textAnchor="middle"
        fill="#FFC107"
        fontSize="9"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        MoMo
      </text>
      <path
        d="M30 22 L32 24 L36 20"
        stroke="#FFC107"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
