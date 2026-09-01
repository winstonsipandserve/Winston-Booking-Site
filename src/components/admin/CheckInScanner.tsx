'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import CheckInResultCard, { type CheckInResult } from '@/components/admin/CheckInResultCard'

const SCANNER_ELEMENT_ID = 'check-in-scanner-region'

type ScanResult = CheckInResult

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

    const startPromise = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        handleDecode(decodedText)
      },
      () => {
        // Per-frame decode misses are expected while no code is in view — ignore.
      },
    )

    startPromise
      .then(() => {
        // React Strict Mode's dev-mode double-invoke can run this effect's
        // cleanup before start() resolves. If that already happened, tear the
        // camera down immediately instead of flipping to "scanning" — the
        // cleanup below handles the opposite ordering (start() resolving
        // before cleanup runs), so either way the camera stops exactly once.
        if (cancelled) {
          return scanner.stop().then(() => scanner.clear())
        }
        setIsScanning(true)
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
      startPromise
        .then(() => {
          if (scanner.isScanning) {
            return scanner.stop().then(() => scanner.clear())
          }
        })
        .catch(() => {})
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

      {result && (
        <CheckInResultCard result={result} actionLabel="Scan Next" onAction={handleScanNext} />
      )}
    </div>
  )
}
