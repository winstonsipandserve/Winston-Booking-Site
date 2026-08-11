interface DateTimeStepProps {
  startTimeLocal: string
  onStartTimeChange: (value: string) => void
  durationMinutes: string
  onDurationChange: (value: string) => void
  durationOptions: number[]
}

export default function DateTimeStep({
  startTimeLocal,
  onStartTimeChange,
  durationMinutes,
  onDurationChange,
  durationOptions,
}: DateTimeStepProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="startTime" className="text-sm font-medium">
          Date &amp; time
        </label>
        <input
          id="startTime"
          type="datetime-local"
          required
          value={startTimeLocal}
          onChange={(e) => onStartTimeChange(e.target.value)}
          className="rounded border border-black/[.145] bg-transparent px-3 py-2 dark:border-white/[.145]"
        />
      </div>

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
    </div>
  )
}
