import Link from 'next/link'

export type GateNotice = {
  category: string
  title: string
  body: string
  publishedAt: string
  affectedFacility?: string
  action?: string
}

interface AnnouncementGateProps {
  notices: GateNotice[]
  onContinue: () => void
}

export default function AnnouncementGate({ notices, onContinue }: AnnouncementGateProps) {
  return (
    <div className="relative w-full py-10 md:py-16">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-brand-dark/[0.05]"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="gate-dot-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="34" cy="42" r="12" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="150" cy="28" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="170" cy="150" r="16" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="55" cy="160" r="42" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gate-dot-pattern)" />
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6 rounded-card border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        {notices.length > 0 && (
          <div className="flex flex-col">
            {notices.map((notice, index) => (
              <div
                key={notice.title}
                className={`flex flex-col gap-1 py-4 ${index === 0 ? '' : 'border-t border-brand-dark/10'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-accent-primary">
                    {notice.category}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-neutral-700/60">
                    {notice.publishedAt}
                  </span>
                </div>
                <h3 className="font-serif text-lg text-brand-dark">{notice.title}</h3>
                <p className="font-sans text-sm text-neutral-700">{notice.body}</p>
                {(notice.affectedFacility || notice.action) && (
                  <p className="mt-1 text-xs text-brand-dark/70">
                    {notice.affectedFacility}
                    {notice.affectedFacility && notice.action && ' — '}
                    {notice.action}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="self-center text-center text-xs text-brand-dark/60">
          Already a member?{' '}
          <Link href="/login" className="font-medium text-accent-primary underline underline-offset-2">
            Sign in
          </Link>{' '}
          for member rates and priority booking.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="self-center rounded-none bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Continue to Booking
        </button>
      </div>
    </div>
  )
}
