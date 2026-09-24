interface ComingSoonProps {
  title: string
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
      <p className="text-gray-500">Details soon.</p>
    </section>
  )
}
