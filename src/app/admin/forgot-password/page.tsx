import AdminForgotPasswordForm from '@/components/admin/AdminForgotPasswordForm'
import { ADMIN_THEME_INIT_SCRIPT } from '@/lib/admin-theme-init-script'

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans dark:bg-gray-950">
      <script
        dangerouslySetInnerHTML={{
          __html: ADMIN_THEME_INIT_SCRIPT,
        }}
      />
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Winston Sip &amp; Serve</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Enter your admin email and we&apos;ll send you a link to reset your password.
        </p>
        <AdminForgotPasswordForm />
      </div>
    </div>
  )
}
