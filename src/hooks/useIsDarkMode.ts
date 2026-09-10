'use client'

import { useSyncExternalStore } from 'react'

function subscribeToThemeChanges(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getIsDarkModeSnapshot() {
  return document.documentElement.classList.contains('dark')
}

export function useIsDarkMode(): boolean {
  return useSyncExternalStore(subscribeToThemeChanges, getIsDarkModeSnapshot, () => false)
}
