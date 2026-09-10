'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function AdminLoginErrorModal({ hasError }: { hasError: boolean }) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const isOpen = hasError && !dismissed

  function handleClose() {
    setDismissed(true)
    router.replace('/admin/login')
  }

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleClose}
      hideCancel
      confirmLabel="OK"
      title="Sign-In Failed"
      message="Invalid email or password."
    />
  )
}
