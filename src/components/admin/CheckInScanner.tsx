'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { formatCentavos } from '@/lib/format'

const SCANNER_ELEMENT_ID = 'check-in-scanner-region'

type ScanResult =
  | { status: 'not_found' }
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

export default function CheckInScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isHandlingScanRef = useRef(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner
    let cancelled = false

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleDecode(decodedText)
        },
        () => {
          // Per-frame decode misses are expected while no code is in view — ignore.
        },
      )
      .then(() => {
        if (!cancelled) setIsScanning(true)
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraError(
            'Camera access is unavailable. Grant camera permission, or use a device with a camera, to scan member codes.',
          )
        }
        console.error('Failed to start QR scanner', err)
      })

    return () => {
      cancelled = true
      const currentScanner = scannerRef.current
      if (currentScanner?.isScanning) {
        currentScanner.stop().catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDecode(token: string) {
    if (isHandlingScanRef.current) return
    isHandlingScanRef.current = true

    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      scanner.pause(true)
    }

    setIsVerifying(true)
    try {
      const res = await fetch(`/api/admin/check-in/${encodeURIComponent(token)}`)
      const json = await res.json().catch(() => null)

      if (res.status === 404) {
        setResult({ status: 'not_found' })
      } else if (res.ok && json?.hasMembership === false) {
        setResult({ status: 'no_membership', name: json.name })
      } else if (res.ok && json?.hasMembership === true) {
        setResult({
          status: json.isExpired ? 'expired' : 'active',
          name: json.name,
          email: json.email,
          tierName: json.tierName,
          expiryDateLabel: json.expiryDateLabel,
          remainingCreditCentavos: json.remainingCreditCentavos,
          creditCentavos: json.creditCentavos,
        })
      } else {
        setResult({ status: 'not_found' })
      }
    } catch (err) {
      console.error('Failed to verify scanned code', err)
      setResult({ status: 'not_found' })
    } finally {
      setIsVerifying(false)
    }
  }

  function handleScanNext() {
    isHandlingScanRef.current = false
    setResult(null)
    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      scanner.resume()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={SCANNER_ELEMENT_ID}
        className={`w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 ${result ? 'hidden' : ''}`}
      />

      {cameraError && <p className="max-w-sm text-center text-sm text-red-600">{cameraError}</p>}

      {!cameraError && !result && (
        <p className="text-sm text-gray-500">
          {isScanning ? "Point the camera at a member's QR code." : 'Starting camera…'}
        </p>
      )}

      {isVerifying && <p className="text-sm text-gray-500">Verifying…</p>}

      {result && <ResultCard result={result} onScanNext={handleScanNext} />}
    </div>
  )
}

function ResultCard({ result, onScanNext }: { result: ScanResult; onScanNext: () => void }) {
  if (result.status === 'not_found') {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">Code not recognized</p>
        <ScanNextButton onClick={onScanNext} />
      </div>
    )
  }

  if (result.status === 'no_membership') {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm font-semibold text-gray-700">{result.name}</p>
        <p className="text-sm text-gray-500">No membership on file.</p>
        <ScanNextButton onClick={onScanNext} />
      </div>
    )
  }

  const isActive = result.status === 'active'

  return (
    <div
      className={`flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border p-6 text-center ${
        isActive ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <p className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-amber-700'}`}>
        {isActive ? 'Active Member' : 'Membership Expired'}
      </p>
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
      <ScanNextButton onClick={onScanNext} />
    </div>
  )
}

function ScanNextButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
    >
      Scan Next
    </button>
  )
}
