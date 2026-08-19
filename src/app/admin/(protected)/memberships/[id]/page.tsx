import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/supabase-storage'
import type { MembershipTier } from '@prisma/client'

function formatTier(tier: MembershipTier) {
  switch (tier) {
    case 'three_month':
      return '3-Month'
    case 'six_month':
      return '6-Month'
    case 'twelve_month':
      return '12-Month'
  }
}

export default async function AdminMembershipApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: { customer: true, reviewedBy: true },
  })

  if (!application) {
    notFound()
  }

  const [govIdFrontUrl, govIdBackUrl, govIdSelfieUrl] = await Promise.all([
    getSignedUrl('membership-applications', application.govIdFrontUrl),
    getSignedUrl('membership-applications', application.govIdBackUrl),
    getSignedUrl('membership-applications', application.govIdSelfieUrl),
  ])

  return (
    <div>
      <p>
        <Link href="/admin/memberships">&larr; Back to memberships</Link>
      </p>
      <h1>Membership Application {application.id}</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Applicant</h2>
        <table cellPadding={4}>
          <tbody>
            <tr>
              <td>Name</td>
              <td>{application.customer.name}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{application.customer.email}</td>
            </tr>
            <tr>
              <td>Phone</td>
              <td>{application.customer.phone}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Application</h2>
        <table cellPadding={4}>
          <tbody>
            <tr>
              <td>Requested Tier</td>
              <td>{formatTier(application.requestedTier)}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>{application.status}</td>
            </tr>
            <tr>
              <td>Address</td>
              <td>{application.address}</td>
            </tr>
            <tr>
              <td>Contact Number</td>
              <td>{application.contactNumber}</td>
            </tr>
            <tr>
              <td>Submitted</td>
              <td>{application.createdAt.toLocaleString('en-PH')}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Review</h2>
        <table cellPadding={4}>
          <tbody>
            <tr>
              <td>Reviewed By</td>
              <td>{application.reviewedBy?.name ?? 'Not yet reviewed'}</td>
            </tr>
            <tr>
              <td>Reviewed At</td>
              <td>{application.reviewedAt ? application.reviewedAt.toLocaleString('en-PH') : '—'}</td>
            </tr>
            {application.status === 'rejected' && application.rejectionReason && (
              <tr>
                <td>Rejection Reason</td>
                <td>{application.rejectionReason}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Government ID</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p>Front</p>
            <img src={govIdFrontUrl} alt="Government ID — front" style={{ maxWidth: '280px' }} />
          </div>
          <div>
            <p>Back</p>
            <img src={govIdBackUrl} alt="Government ID — back" style={{ maxWidth: '280px' }} />
          </div>
          <div>
            <p>Selfie</p>
            <img src={govIdSelfieUrl} alt="Government ID — selfie" style={{ maxWidth: '280px' }} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Review Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Approve
          </button>
          <button type="button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Reject
          </button>
        </div>
        <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
          Approve/reject actions are not wired yet — coming in a future update.
        </p>
      </section>
    </div>
  )
}
