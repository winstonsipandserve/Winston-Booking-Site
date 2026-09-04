'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function AdminLoginErrorModal({ hasError }: { hasError: boolean }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(hasError)

  useEffect(() => {
    setIsOpen(hasError)
  }, [hasError])

  function handleClose() {
    setIsOpen(false)
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
