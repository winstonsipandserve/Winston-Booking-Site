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
  tennis_sim: '15 min ₱300 · 30 min ₱450 · 60 min ₱800',
  pickleball_sim: '15 min ₱300 · 30 min ₱450 · 60 min ₱800',
  golf_sim: '60 min ₱1,150 · 90 min ₱1,450',
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
            className={`flex flex-col items-start gap-1 rounded px-4 py-3 text-left transition-colors ${
              isSelected
                ? 'border-2 border-accent-primary bg-accent-primary/10'
                : 'border border-brand-dark/20 bg-brand-light hover:bg-brand-dark/5'
            }`}
          >
            <span className={`text-brand-dark ${isSelected ? 'font-semibold' : 'font-medium'}`}>{rt.name}</span>
            <span className="text-sm text-brand-dark/60">
              {countLabel(rt.resources.length, rt.category)}
            </span>
            {NON_MEMBER_PRICE_LABEL[rt.slug] && (
              <span className="text-sm text-brand-dark/60">
                {NON_MEMBER_PRICE_LABEL[rt.slug]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
