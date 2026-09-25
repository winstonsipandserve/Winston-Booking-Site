import Link from 'next/link'

export default function Hero() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <h1 className="text-5xl font-bold text-gray-900 md:text-7xl">Winston</h1>
      <p className="max-w-xl text-sm uppercase tracking-[0.2em] text-gray-500">
        Tennis · Pickleball · Golf Simulator · Café & Bar
      </p>
      <Link
        href="/book"
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-700"
      >
        Book Now
      </Link>
    </section>
  )
}
