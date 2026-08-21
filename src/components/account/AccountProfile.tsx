// SAMPLE CONTENT — hardcoded placeholder profile data for this frontend-only pass.
// Replace once member auth (Auth.js session tied to Customer) is wired.
const SAMPLE_PROFILE = {
  name: 'Arjay Dela Cruz',
  email: 'member@winstonsipandserve.com',
  phone: '+63 917 123 4567',
}

export default function AccountProfile() {
  return (
    <div className="flex flex-col rounded-2xl border border-brand-dark/10 bg-brand-light px-6 py-6 shadow-card">
      <h2 className="font-serif text-xl text-brand-dark">Profile</h2>
      <dl className="mt-4 flex flex-col">
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-brand-dark/70">Name</dt>
          <dd className="text-right font-medium text-brand-dark">{SAMPLE_PROFILE.name}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="text-brand-dark/70">Email</dt>
          <dd className="text-right font-medium text-brand-dark">{SAMPLE_PROFILE.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-dark/10 py-3">
          <dt className="text-brand-dark/70">Phone</dt>
          <dd className="text-right font-medium text-brand-dark">{SAMPLE_PROFILE.phone}</dd>
        </div>
      </dl>
    </div>
  )
}
