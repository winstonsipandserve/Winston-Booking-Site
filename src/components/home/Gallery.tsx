import Image from 'next/image'

const IMAGE_COUNT = 6

export default function Gallery() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-mid">
            PHOTO GALLERY
          </span>
          <h2 className="mt-3 text-4xl font-semibold text-brand-dark">See the Space</h2>
          <p className="mx-auto mt-3 max-w-xl text-xl text-gray-600">
            Modern, clean, and purpose-built for players and cafe guests alike.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {Array.from({ length: IMAGE_COUNT }).map((_, index) => (
            <div
              key={index}
              className="group relative aspect-square w-full overflow-hidden rounded-2xl"
            >
              <Image
                src="/images/placeholder.jpg"
                alt="Winston Sip & Serve gallery photo"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/0 text-white opacity-0 transition-all duration-200 group-hover:bg-brand-dark/50 group-hover:opacity-100">
                <span className="text-3xl font-light">+</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
