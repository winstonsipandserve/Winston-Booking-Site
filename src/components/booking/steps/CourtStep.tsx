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
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
              className={`rounded border px-4 py-3 text-center font-medium transition-colors ${
                isSelected
                  ? 'border-foreground bg-black/[.04] dark:bg-white/[.08]'
                  : 'border-black/[.145] hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.04]'
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
