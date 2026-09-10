export function applyStoredAdminTheme() {
  try {
    if (!window.location.pathname.startsWith('/admin')) return

    const t = localStorage.getItem('winston-admin-theme') || 'system'
    const d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (d) {
      document.documentElement.classList.add('dark')
    }
  } catch {}
}

export const ADMIN_THEME_INIT_SCRIPT = `(${applyStoredAdminTheme.toString()})();`
