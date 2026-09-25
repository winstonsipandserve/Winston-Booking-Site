const STEP_LABELS = ['ACTIVITY', 'LOCATION', 'DATE & TIME', 'ADD-ONS', 'SUMMARY']

interface StepIndicatorProps {
  currentStep: number
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <ol className="flex w-full max-w-md items-start justify-between">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isComplete = stepNumber < currentStep
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium ${
                isActive || isComplete
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {stepNumber}
            </span>
            <span
              className={`text-center text-[10px] font-medium tracking-wide ${
                isActive ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
