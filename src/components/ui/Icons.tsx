interface IconProps {
  className?: string
}

export function TennisIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 3.5v12M3.5 9.5h12M6 5.7l7 7.6M13 5.7l-7 7.6"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path d="M13.7 13.7L20.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PickleballIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2.5" width="12" height="14.5" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="7.5" r="0.7" fill="currentColor" />
      <circle cx="12" cy="7.5" r="0.7" fill="currentColor" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
      <circle cx="12" cy="11.5" r="0.7" fill="currentColor" />
      <path d="M10 17v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function GolfIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 21V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 4l9 3.5-9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="6.5" cy="21" rx="4" ry="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function LocationIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function CalendarIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ClockIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GuestsIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16.5" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.8 14.8c2.6.3 4.7 2.3 4.7 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BallBoyIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 8.5c3 2 12 2 15 0M4.5 15.5c3-2 12-2 15 0" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export function CoachingIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="14" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="14" r="1.2" fill="currentColor" />
      <path d="M11.5 11.5L18 5M15 5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
