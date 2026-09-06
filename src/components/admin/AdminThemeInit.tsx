'use client'

import { useLayoutEffect } from 'react'
import { applyStoredAdminTheme } from '@/lib/admin-theme-init-script'

// Safety net for a client-side (soft) navigation mounting one of the 4 script-tag
// call sites for the first time this session (e.g. straight after /admin/login's
// signIn() redirect, or a next/link between the 3 auth pages) — React never executes
// a <script> tag it renders itself, so the inline script silently no-ops on that
// transition. useLayoutEffect fires before paint, so this still prevents a visible
// flash for that case, while the inline <script> tags remain correct for real hard
// page loads (where this effect only fires after hydration and would otherwise be
// too late).
export default function AdminThemeInit() {
  useLayoutEffect(() => {
    applyStoredAdminTheme()
  }, [])

  return null
}
