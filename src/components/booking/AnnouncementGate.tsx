interface AnnouncementGateProps {
  onContinue: () => void
}

export default function AnnouncementGate({ onContinue }: AnnouncementGateProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded border border-black/[.08] bg-black/[.03] px-6 py-8 text-center dark:border-white/[.08] dark:bg-white/[.04]">
      <h2 className="text-xl font-semibold">Welcome to Winston Sip and Serve</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Our courts and simulators are open daily. Please note that all bookings are held for a
        limited time pending payment confirmation — check back here for any updates on hours or
        availability before booking.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="self-center rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Continue to Booking
      </button>
    </div>
  )
}
