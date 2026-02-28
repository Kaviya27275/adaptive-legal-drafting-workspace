export default function LexoraIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lexoraGradient" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#lexoraGradient)" />
      <path d="M21 20v24h16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m30 24 14 14" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="m44 24-6 6" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
