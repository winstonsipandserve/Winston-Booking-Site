const SOCIAL_ICONS = [
  {
    label: 'Facebook',
    path: 'M13.5 9H15V6.5h-1.75C11.2 6.5 10 7.7 10 9.75V11H8.5v2.5H10V18h2.5v-4.5H14l.5-2.5h-2v-1c0-.6.2-1 1-1Z',
  },
  {
    label: 'Instagram',
    path: 'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm4.5-3.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z',
  },
  {
    label: 'X',
    path: 'M4 4l7.2 8.1L4.4 20H7l5.4-6.2L16.8 20H20l-7.6-8.6L19.4 4H16.8l-5 5.7L7.4 4H4Z',
  },
]

interface SocialIconsProps {
  variant?: 'dark' | 'light'
  className?: string
}

export default function SocialIcons({ variant = 'dark', className = '' }: SocialIconsProps) {
  const isLight = variant === 'light'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {SOCIAL_ICONS.map((icon) => (
        <a
          key={icon.label}
          href="#"
          aria-label={icon.label}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            isLight
              ? 'border-white/30 text-white hover:bg-white/10'
              : 'border-brand-mid text-brand-dark hover:bg-accent-light'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d={icon.path} />
          </svg>
        </a>
      ))}
    </div>
  )
}
