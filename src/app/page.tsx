import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Winston Sip and Serve
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Book tennis and pickleball courts, or tennis, pickleball, and golf simulator bays.
      </p>
      <Link
        href="/book"
        className="rounded-full bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Book Now
      </Link>
    </div>
  )
}
