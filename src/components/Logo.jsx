import { splitBrandName } from '../lib/config'

export function Mark({ size = 44, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="17" fill="currentColor" />
      <path
        d="M16 44 V26 L32 38 L48 22 V44"
        fill="none"
        stroke="var(--mark-stroke, #F3F0E7)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="18" r="4" fill="var(--mark-stroke, #F3F0E7)" />
    </svg>
  )
}

export default function Logo({ name, compact = false, dark = false }) {
  const { head, tail } = splitBrandName(name)
  return (
    <span className="inline-flex items-center gap-3 select-none">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line/70 shadow-tile"
        style={{
          background: dark ? '#F3F0E7' : '#2A2529',
          color: dark ? '#F3F0E7' : '#2A2529',
          ['--mark-stroke']: dark ? '#2A2529' : '#F3F0E7',
        }}
      >
        <Mark size={26} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={`text-[19px] font-extrabold tracking-[-0.02em] ${dark ? 'text-cream-100' : 'text-ink-900'}`}>
            {head}
          </span>{' '}
          <span className={`text-[19px] font-medium tracking-[-0.01em] ${dark ? 'text-cream-300' : 'text-ink-700'}`}>
            {tail}
          </span>
        </span>
      )}
    </span>
  )
}
