import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden bg-brand-dark pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-accent-light/90 md:text-sm">
            Password Reset
          </span>

          <h1 className="mt-5 font-serif text-4xl text-brand-light md:text-6xl">
            Forgot Password
          </h1>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <ForgotPasswordForm />
        </div>
      </section>

      <Footer />
    </>
  )
}
