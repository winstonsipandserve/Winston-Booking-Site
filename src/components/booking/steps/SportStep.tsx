type ResourceCategory = 'court' | 'simulator'

interface ResourceTypeOption {
  id: string
  slug: string
  name: string
  category: ResourceCategory
  resources: { id: string; label: string }[]
}

interface SportStepProps {
  resourceTypes: ResourceTypeOption[]
  resourceTypeId: string
  onSelect: (resourceTypeId: string) => void
}

function countLabel(count: number, category: ResourceCategory): string {
  const unit = category === 'court' ? 'Court' : 'Simulator'
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

const NON_MEMBER_PRICE_LABEL: Record<string, string> = {
  tennis_court: '₱750/hr',
  pickleball_court: '₱650/hr',
  tennis_sim: 'From ₱300',
  pickleball_sim: 'From ₱300',
  golf_sim: 'From ₱1,150',
}

export default function SportStep({ resourceTypes, resourceTypeId, onSelect }: SportStepProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {resourceTypes.map((rt) => {
        const isSelected = rt.id === resourceTypeId
        return (
          <button
            key={rt.id}
            type="button"
            onClick={() => onSelect(rt.id)}
            className={`flex flex-col items-start gap-1 rounded border px-4 py-3 text-left transition-colors ${
              isSelected
                ? 'border-foreground bg-black/[.04] dark:bg-white/[.08]'
                : 'border-black/[.145] hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.04]'
            }`}
          >
            <span className="font-medium">{rt.name}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {countLabel(rt.resources.length, rt.category)}
            </span>
            {NON_MEMBER_PRICE_LABEL[rt.slug] && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {NON_MEMBER_PRICE_LABEL[rt.slug]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
