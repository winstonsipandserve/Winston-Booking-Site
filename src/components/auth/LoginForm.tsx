export default function LoginForm({
  action,
  error,
}: {
  action: (formData: FormData) => void
  error?: boolean
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-8 shadow-xl shadow-brand-dark/10">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-brand-dark">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-lg border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-brand-dark">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded-lg border border-brand-dark/20 bg-brand-light px-3 py-2 text-brand-dark placeholder:text-brand-dark/40 focus:border-accent-primary focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">Invalid email or password.</p>}

        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-light transition-colors duration-300 hover:bg-brand-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
        >
          Sign In
        </button>

        <span className="text-center text-sm text-brand-dark/50">Forgot password?</span>
      </form>
    </div>
  )
}
