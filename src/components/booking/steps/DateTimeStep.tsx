import Calendar from '../Calendar'
import TimeSlotGrid from '../TimeSlotGrid'

interface BusyRange {
  start: string
  end: string
}

interface DateTimeStepProps {
  durationMinutes: string
  onDurationChange: (value: string) => void
  durationOptions: number[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  resourceCategory: string
  resourceSlug: string
  busy: BusyRange[]
  availabilityLoading: boolean
  availabilityError: string | null
  selectedSlot: string | null
  onSelectSlot: (startTimeIso: string) => void
}

export default function DateTimeStep({
  durationMinutes,
  onDurationChange,
  durationOptions,
  selectedDate,
  onSelectDate,
  resourceCategory,
  resourceSlug,
  busy,
  availabilityLoading,
  availabilityError,
  selectedSlot,
  onSelectSlot,
}: DateTimeStepProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Duration</span>
        <div role="group" aria-label="Duration" className="flex flex-wrap gap-2">
          {durationOptions.map((d) => {
            const isSelected = String(d) === durationMinutes
            return (
              <button
                key={d}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onDurationChange(String(d))}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-foreground bg-black/[.04] dark:bg-white/[.08]'
                    : 'border-black/[.145] hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.04]'
                }`}
              >
                {d} minutes
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Date</span>
        <Calendar selectedDate={selectedDate} onSelectDate={onSelectDate} />
      </div>

      {selectedDate && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Time</span>
          {availabilityError && <p className="text-sm text-red-600">{availabilityError}</p>}
          <TimeSlotGrid
            selectedDate={selectedDate}
            resourceCategory={resourceCategory}
            resourceSlug={resourceSlug}
            durationMinutes={Number(durationMinutes)}
            busy={busy}
            loading={availabilityLoading}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
          />
        </div>
      )}
    </div>
  )
}
