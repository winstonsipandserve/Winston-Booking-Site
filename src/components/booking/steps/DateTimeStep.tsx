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
  membershipCoverageNotice: string | null
  /** True for a date beyond the applicable advance-booking window. */
  isDateDisabled: (dateKey: string) => boolean
  /** e.g. "Non-members can book up to 3 days ahead." */
  advanceWindowNote: string
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
  membershipCoverageNotice,
  isDateDisabled,
  advanceWindowNote,
}: DateTimeStepProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Date & Time</h2>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-900">Duration</span>
        <div role="group" aria-label="Duration" className="flex flex-wrap gap-2">
          {durationOptions.map((d) => {
            const isSelected = String(d) === durationMinutes
            return (
              <button
                key={d}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onDurationChange(String(d))}
                className={`rounded-md px-4 py-2 text-sm text-gray-900 transition-colors ${
                  isSelected
                    ? 'border-2 border-gray-900 bg-gray-50 font-semibold'
                    : 'border border-gray-200 bg-white font-medium hover:bg-gray-50'
                }`}
              >
                {d} minutes
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-900">Date</span>
        <Calendar selectedDate={selectedDate} onSelectDate={onSelectDate} isDateDisabled={isDateDisabled} />
        <p className="text-sm text-gray-500">{advanceWindowNote}</p>
      </div>

      {membershipCoverageNotice && (
        <p role="status" className="border-l-4 border-gray-400 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {membershipCoverageNotice}
        </p>
      )}

      {selectedDate && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-900">Time</span>
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
