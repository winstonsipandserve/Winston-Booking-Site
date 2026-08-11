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
        <label htmlFor="duration" className="text-sm font-medium">
          Duration
        </label>
        <select
          id="duration"
          value={durationMinutes}
          onChange={(e) => onDurationChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        >
          {durationOptions.map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </select>
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
