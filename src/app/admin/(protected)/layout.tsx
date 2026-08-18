import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '../../../../auth'

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
          padding: '1rem 2rem',
          borderBottom: '1px solid #ccc',
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/admin">Admin</Link>
          <Link href="/admin/bookings">Bookings</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
