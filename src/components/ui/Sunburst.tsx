interface SunburstProps {
  lines?: number
  className?: string
}

export default function Sunburst({ lines = 20, className = '' }: SunburstProps) {
  const angleStep = (2 * Math.PI) / lines

  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1" fill="none">
        {Array.from({ length: lines }).map((_, i) => {
          const angle = i * angleStep
          const x2 = 100 * Math.cos(angle)
          const y2 = 100 * Math.sin(angle)
          return <line key={i} x1="0" y1="0" x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
        })}
      </g>
    </svg>
  )
}
