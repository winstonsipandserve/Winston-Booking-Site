import { redirect } from 'next/navigation'
import { auth, signOut } from '../../../auth'

export default async function AdminPage() {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <p>Signed in as {session.user?.email}.</p>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/admin/login' })
        }}
      >
        <button type="submit">Sign Out</button>
      </form>
    </div>
  )
}
