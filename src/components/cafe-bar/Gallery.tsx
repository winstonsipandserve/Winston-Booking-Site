import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'

interface GalleryTile {
  alt: string
  position: string
}

const CAFE_TILES: GalleryTile[] = [
  { alt: 'Café interior seating', position: 'center' },
  { alt: 'Coffee bar counter', position: 'top' },
  { alt: 'Daytime lounge view', position: 'bottom' },
]

const BAR_TILES: GalleryTile[] = [
  { alt: 'Speakeasy entrance', position: '20% 70%' },
  { alt: 'Bar and lounge seating', position: 'top' },
  { alt: 'Evening ambiance', position: 'bottom' },
]

interface GalleryProps {
  mode: 'cafe' | 'bar'
}

export default function Gallery({ mode }: GalleryProps) {
  const tiles = mode === 'cafe' ? CAFE_TILES : BAR_TILES
  const overlayClass =
    mode === 'cafe'
      ? 'bg-gradient-to-t from-brand-dark/40 via-brand-dark/5 to-transparent'
      : 'bg-gradient-to-t from-brand-dark/75 via-brand-dark/20 to-transparent'

  return (
    <section className="bg-background py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.3em] text-accent-primary">A Look Inside</p>
          <h2 className="mt-4 font-serif text-4xl text-brand-dark md:text-5xl">Café &amp; Bar Gallery</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
          {tiles.map((tile, index) => (
            <Reveal key={tile.alt} delayMs={index * 100} className="h-56 md:h-72">
              <div className="group relative h-full w-full overflow-hidden rounded-2xl">
                <Image
                  src="/images/placeholder.jpg"
                  alt={tile.alt}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  style={{ objectPosition: tile.position }}
                />
                <div className={`pointer-events-none absolute inset-0 ${overlayClass}`} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
