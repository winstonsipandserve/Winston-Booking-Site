interface ResourceOption {
  id: string
  label: string
}

interface CourtStepProps {
  resourceTypeName: string
  resources: ResourceOption[]
  resourceId: string
  onSelect: (resourceId: string) => void
}

export default function CourtStep({
  resourceTypeName,
  resources,
  resourceId,
  onSelect,
}: CourtStepProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm text-brand-dark/60">
        Choose a {resourceTypeName.toLowerCase()} to book.
      </p>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {resources.map((r) => {
          const isSelected = r.id === resourceId
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={`rounded-none px-4 py-3 text-center text-brand-dark transition-colors ${
                isSelected
                  ? 'border-2 border-accent-primary bg-accent-primary/10 font-semibold'
                  : 'border border-brand-dark/20 bg-brand-light font-medium hover:bg-brand-dark/5'
              }`}
            >
              {r.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
