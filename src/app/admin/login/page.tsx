import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn } from '../../../../auth'

async function authenticate(formData: FormData) {
  'use server'
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/admin/login?error=1')
    }
    throw error
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Admin Login</h1>
      {error && <p style={{ color: 'red' }}>Invalid email or password.</p>}
      <form action={authenticate}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <br />
          <input id="email" name="email" type="email" required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <br />
          <input id="password" name="password" type="password" required style={{ width: '100%' }} />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </div>
  )
}
