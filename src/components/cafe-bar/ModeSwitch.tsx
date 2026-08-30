interface ModeSwitchProps {
  mode: 'cafe' | 'bar'
  onModeChange: (mode: 'cafe' | 'bar') => void
}

export default function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <div className="mt-8 inline-flex rounded-none border border-brand-light/25 bg-brand-light/5 p-1">
      <button
        type="button"
        aria-pressed={mode === 'cafe'}
        onClick={() => onModeChange('cafe')}
        className={`rounded-none px-6 py-2 text-sm font-medium uppercase tracking-wide transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
          mode === 'cafe' ? 'bg-accent-primary text-brand-light' : 'text-brand-light/70 hover:text-brand-light'
        }`}
      >
        Café
      </button>
      <button
        type="button"
        aria-pressed={mode === 'bar'}
        onClick={() => onModeChange('bar')}
        className={`rounded-none px-6 py-2 text-sm font-medium uppercase tracking-wide transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
          mode === 'bar' ? 'bg-accent-teal text-brand-light' : 'text-brand-light/70 hover:text-brand-light'
        }`}
      >
        Bar
      </button>
    </div>
  )
}
