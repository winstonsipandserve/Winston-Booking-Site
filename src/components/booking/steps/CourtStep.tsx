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
    <div className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Court</h2>
      <p className="text-sm text-gray-500">
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
              className={`rounded-md px-4 py-3 text-center text-gray-900 transition-colors ${
                isSelected
                  ? 'border-2 border-gray-900 bg-gray-50 font-semibold'
                  : 'border border-gray-200 bg-white font-medium hover:bg-gray-50'
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
