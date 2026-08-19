export default function ComingSoonSection({
  title,
  bullets,
}: {
  title: string
  bullets: string[]
}) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Coming soon.</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  )
}
