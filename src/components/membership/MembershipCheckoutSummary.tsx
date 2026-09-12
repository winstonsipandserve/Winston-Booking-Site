import { formatCentavos } from '@/lib/format'

interface MembershipCheckoutSummaryProps {
  tierLabel: string
  customerName?: string
  activationFeeCentavos: number
  creditCentavos: number
  totalCentavos: number
}

export default function MembershipCheckoutSummary({
  tierLabel,
  customerName,
  activationFeeCentavos,
  creditCentavos,
  totalCentavos,
}: MembershipCheckoutSummaryProps) {
  return (
    <div className="rounded-card border border-brand-dark/10 bg-brand-light px-6 py-7 shadow-card sm:px-8 sm:py-8">
      <div className="border-b border-brand-dark/10 pb-5">
        <p className="font-serif text-2xl text-brand-dark">{tierLabel} Membership</p>
        {customerName && <p className="mt-1 text-sm text-brand-dark/60">for {customerName}</p>}
      </div>

      <dl className="flex flex-col divide-y divide-brand-dark/10">
        <div className="flex justify-between gap-4 py-3.5">
          <dt className="text-sm text-brand-dark/65">Activation Fee</dt>
          <dd className="text-right font-medium tabular-nums text-brand-dark/85">
            {formatCentavos(activationFeeCentavos)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3.5">
          <dt className="text-sm text-brand-dark/65">F&amp;B Credit</dt>
          <dd className="text-right font-medium tabular-nums text-brand-dark/85">
            {formatCentavos(creditCentavos)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-card-inline bg-brand-dark px-5 py-4 text-brand-light">
        <span className="text-sm font-medium uppercase tracking-[0.16em] text-brand-light/75">
          Total Due
        </span>
        <span className="font-serif text-3xl tabular-nums text-brand-light">
          {formatCentavos(totalCentavos)}
        </span>
      </div>
    </div>
  )
}
