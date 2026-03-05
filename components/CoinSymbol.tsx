export function CoinSymbol({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="#f59e0b" />
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="#d97706" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="11" fill="url(#coinHighlight)" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#92400e"
      >
        ₩
      </text>
      <defs>
        <radialGradient id="coinHighlight" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
