interface IconProps {
  className?: string
}

export function DashboardIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function BookingsIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 13.5h3M8 16.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ResourcesIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.5 3.5h4.5a1.5 1.5 0 0 1 1.5 1.5v4.5a2 2 0 0 1-.6 1.4l-8.4 8.4a2 2 0 0 1-2.8 0l-3.3-3.3a2 2 0 0 1 0-2.8l8.4-8.4a2 2 0 0 1 1.4-.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="8" r="1.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function MembershipsIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.8 14.8c2.6.3 4.7 2.3 4.7 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BulletinIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.5 10.5v3a1.5 1.5 0 0 0 1.5 1.5h1l1 5h2l-.8-5h1.3l8 3.5v-12l-8 3.5h-4.5a1.5 1.5 0 0 0-1.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M18 9.5a3.5 3.5 0 0 1 0 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function FoldIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 9.5l-2.5 2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UserIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 20c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SignOutIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.5 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15.5 16l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
