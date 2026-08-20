import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'

interface GalleryTile {
  alt: string
  position: string
}

const GALLERY_TILES: GalleryTile[] = [
  { alt: 'Café interior seating', position: 'center' },
  { alt: 'Bar and lounge area', position: 'top' },
  { alt: 'Speakeasy entrance', position: '20% 70%' },
  { alt: 'Outdoor patio seating', position: 'bottom' },
]

export default function Gallery() {
  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">A Look Inside</p>
          <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">Café &amp; Bar Gallery</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {GALLERY_TILES.map((tile, index) => (
            <Reveal key={tile.alt} delayMs={index * 100} className="h-56 md:h-72">
              <div className="group relative h-full w-full overflow-hidden rounded-2xl">
                <Image
                  src="/images/placeholder.jpg"
                  alt={tile.alt}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  style={{ objectPosition: tile.position }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
