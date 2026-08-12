import Image from 'next/image'

type ResourceCategory = 'court' | 'simulator'

interface ResourceTypeCard {
  id: string
  slug: string
  name: string
  category: ResourceCategory
  resources: { id: string; label: string }[]
}

interface ChooseYourSportProps {
  resourceTypes: ResourceTypeCard[]
}

function countLabel(count: number, category: ResourceCategory): string {
  const unit = category === 'court' ? 'Court' : 'Simulator'
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

export default function ChooseYourSport({ resourceTypes }: ChooseYourSportProps) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-mid">
            WHAT WE OFFER
          </span>
          <h2 className="mt-3 text-4xl font-semibold text-brand-dark">Choose Your Sport</h2>
          <p className="mx-auto mt-3 max-w-xl text-xl text-gray-600">
            Tennis, pickleball, and golf simulation — all under one roof, ready to book.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
          {resourceTypes.map((rt) => (
            <div
              key={rt.id}
              className="overflow-hidden rounded-2xl bg-white shadow-card"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src="/images/placeholder.jpg"
                  alt={rt.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-brand-dark">{rt.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {countLabel(rt.resources.length, rt.category)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
