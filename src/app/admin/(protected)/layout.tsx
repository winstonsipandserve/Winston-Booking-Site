import { redirect } from 'next/navigation'
import { auth, signOut } from '../../../../auth'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: '0.75rem',
          padding: '1rem 2rem',
          borderBottom: '1px solid #ccc',
        }}
      >
        <AdminNav />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>Signed in as {session.user?.email}.</span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin/login' })
            }}
          >
            <button type="submit">Sign Out</button>
          </form>
        </div>
      </header>
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  )
}
