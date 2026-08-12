import { Suspense } from 'react'
import ConfirmationContent from './ConfirmationContent'

export default function BookingConfirmationPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <Suspense
        fallback={<p className="text-zinc-600 dark:text-zinc-400">Loading your booking…</p>}
      >
        <ConfirmationContent />
      </Suspense>
    </div>
  )
}
