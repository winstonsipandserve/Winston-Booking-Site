'use client'

import { useEffect, useState } from 'react'
import AnnouncementGate, { type GateNotice } from '@/components/booking/AnnouncementGate'
import BookingForm, { type ResourcesResponse } from '@/components/booking/BookingForm'

interface MemberContext {
  name: string
  email: string
  phone: string
  isActiveMember: boolean
  creditBalanceCentavos: number
}

interface BookingPageClientProps {
  memberContext: MemberContext | null
}

export default function BookingPageClient({ memberContext }: BookingPageClientProps) {
  const [started, setStarted] = useState(false)
  const [data, setData] = useState<ResourcesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notices, setNotices] = useState<GateNotice[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/resources', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resources')
        return res.json() as Promise<ResourcesResponse>
      })
      .then((json) => {
        setData(json)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setLoadError('Could not load resources. Please refresh the page.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/bulletin/gate-notices', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load notices')
        return res.json() as Promise<{ notices: GateNotice[] }>
      })
      .then((json) => {
        setNotices(json.notices)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        setNotices([])
      })
    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-brand-light px-6 py-16">
      {started ? (
        <BookingForm data={data} loading={loading} loadError={loadError} memberContext={memberContext} />
      ) : (
        <AnnouncementGate notices={notices} onContinue={() => setStarted(true)} />
      )}
    </div>
  )
}
