import type { ReactNode } from 'react'
import { formatCentavos } from '@/lib/format'
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from '@/components/admin/AdminIcons'

export type CheckInResult =
  | { status: 'not_found' }
  | { status: 'rate_limited'; message: string }
  | { status: 'no_membership'; name: string }
  | {
      status: 'active' | 'expired'
      name: string
      email: string
      tierName: string
      expiryDateLabel: string
      remainingCreditCentavos: number
      creditCentavos: number
    }

export default function CheckInResultCard({
  result,
  actionLabel,
  onAction,
}: {
  result: CheckInResult
  actionLabel: string
  onAction: () => void
}) {
  if (result.status === 'not_found' || result.status === 'rate_limited') {
    const message = result.status === 'not_found' ? 'Code not recognized' : result.message
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <StatusHeader icon={<XCircleIcon className="h-5 w-5" />} label={message} colorClass="text-red-700" />
        <ActionButton label={actionLabel} onClick={onAction} />
      </div>
    )
  }

  if (result.status === 'no_membership') {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <StatusHeader
          icon={<InfoIcon className="h-5 w-5" />}
          label="No membership on file."
          colorClass="text-gray-700"
        />
        <p className="text-sm font-semibold text-gray-900">{result.name}</p>
        <ActionButton label={actionLabel} onClick={onAction} />
      </div>
    )
  }

  const isActive = result.status === 'active'

  return (
    <div
      className={`flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border p-6 text-center ${
        isActive ? 'border-gray-200 bg-white' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <StatusHeader
        icon={
          isActive ? <CheckCircleIcon className="h-5 w-5" /> : <AlertTriangleIcon className="h-5 w-5" />
        }
        label={isActive ? 'Active Member' : 'Membership Expired'}
        colorClass={isActive ? 'text-gray-900' : 'text-amber-700'}
      />
      <p className="text-base font-medium text-gray-900">{result.name}</p>
      <p className="text-xs text-gray-500">{result.email}</p>
      <div className="mt-2 flex w-full flex-col gap-1 border-t border-gray-200 pt-3 text-left text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Tier</span>
          <span className="font-medium">{result.tierName}</span>
        </div>
        <div className="flex justify-between">
          <span>Expires</span>
          <span className="font-medium">{result.expiryDateLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining credit</span>
          <span className="font-medium">
            {formatCentavos(result.remainingCreditCentavos)} of {formatCentavos(result.creditCentavos)}
          </span>
        </div>
      </div>
      <ActionButton label={actionLabel} onClick={onAction} />
    </div>
  )
}

function StatusHeader({ icon, label, colorClass }: { icon: ReactNode; label: string; colorClass: string }) {
  return (
    <div className={`flex items-center gap-2 ${colorClass}`}>
      {icon}
      <p className="text-sm font-semibold">{label}</p>
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
    >
      {label}
    </button>
  )
}
