import ModeSwitch from '@/components/cafe-bar/ModeSwitch'

interface CafeBarHeroProps {
  mode: 'cafe' | 'bar'
  onModeChange: (mode: 'cafe' | 'bar') => void
}

export default function CafeBarHero({ mode, onModeChange }: CafeBarHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
          {mode === 'cafe' ? 'Craft Coffee & Conversation' : 'Members-Only Speakeasy'}
        </span>

        <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">
          {mode === 'cafe' ? <>Winston&rsquo;s Café &amp; Bar</> : 'Winston After Dark'}
        </h1>

        <p className="mt-6 max-w-xl text-brand-light/80">
          {mode === 'cafe' ? (
            <>
              Start your morning with a pour-over between sets, or land here after the last point —
              craft coffee by day, and somewhere to unwind once the courts go quiet.
            </>
          ) : (
            <>
              When the courts go quiet, Winston shifts into a low-lit, members-only speakeasy — craft
              coffee by day, a different room entirely once the sun goes down.
            </>
          )}
        </p>

        <ModeSwitch mode={mode} onModeChange={onModeChange} />
      </div>
    </section>
  )
}
