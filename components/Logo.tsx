export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="키워드머니 로고"
    >
      <defs>
        <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.15" />
        </linearGradient>
        {/* 뉴모피즘 그림자 필터 */}
        <filter id="neuShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#b45309" floodOpacity="0.3" />
          <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#fef3c7" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 동전 본체 */}
      <circle cx="28" cy="32" r="22" fill="url(#coinGrad)" filter="url(#neuShadow)" />
      {/* 동전 테두리 */}
      <circle cx="28" cy="32" r="19" fill="none" stroke="url(#coinEdge)" strokeWidth="1.5" />
      {/* 동전 내부 원 */}
      <circle cx="28" cy="32" r="14" fill="none" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
      {/* ₩ 기호 */}
      <text
        x="28"
        y="37"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill="#92400e"
        opacity="0.7"
      >
        ₩
      </text>

      {/* 돋보기 렌즈 (유리 효과) */}
      <circle cx="44" cy="22" r="12" fill="url(#lensGrad)" stroke="#d97706" strokeWidth="2" />
      {/* 돋보기 반사광 */}
      <ellipse cx="40" cy="18" rx="4" ry="3" fill="white" opacity="0.35" transform="rotate(-25 40 18)" />
      {/* 돋보기 손잡이 */}
      <line x1="52" y1="30" x2="59" y2="37" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="52" y1="30" x2="59" y2="37" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
