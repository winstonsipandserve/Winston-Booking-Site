type GateNotice = {
  tag: string
  title: string
  body: string
  publishedAt: string
}

// Mirrors the Prisma `Bulletin` model's title/body/publishedAt shape so a future DB-backed
// fetch is a drop-in replacement; `tag` is UI-only, not a Bulletin column.
const SAMPLE_NOTICES: GateNotice[] = [
  {
    tag: 'FACILITY UPDATE',
    title: 'Golf Simulator Bay 2 Now Open',
    body: 'Our second golf simulator bay is live — book Tennis, Pickleball, or Golf all from one calendar.',
    publishedAt: 'Aug 10, 2026',
  },
  {
    tag: 'HOURS',
    title: 'Extended Weekend Hours',
    body: "We're now open until 10PM Friday through Sunday to fit in one more round.",
    publishedAt: 'Aug 5, 2026',
  },
  {
    tag: 'NEW',
    title: 'Café Menu Refresh',
    body: 'New seasonal drinks and small plates now available at the bar.',
    publishedAt: 'Jul 28, 2026',
  },
]

interface AnnouncementGateProps {
  onContinue: () => void
}

export default function AnnouncementGate({ onContinue }: AnnouncementGateProps) {
  return (
    <div className="relative w-full py-2">
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

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
        <div className="flex flex-col">
          {SAMPLE_NOTICES.map((notice, index) => (
            <div
              key={notice.title}
              className={`flex flex-col gap-1 py-4 ${index === 0 ? '' : 'border-t border-brand-dark/10'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-accent-primary">
                  {notice.tag}
                </span>
                <span className="text-xs uppercase tracking-wide text-neutral-700/60">
                  {notice.publishedAt}
                </span>
              </div>
              <h3 className="font-serif text-lg text-brand-dark">{notice.title}</h3>
              <p className="font-sans text-sm text-neutral-700">{notice.body}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="self-center rounded-full bg-accent-primary px-9 py-3.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Continue to Booking
        </button>
      </div>
    </div>
  )
}
