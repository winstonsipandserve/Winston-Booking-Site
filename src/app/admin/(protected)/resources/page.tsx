import ComingSoonSection from '@/components/admin/ComingSoonSection'

export default function AdminResourcesPage() {
  return (
    <ComingSoonSection
      title="Resources & Pricing"
      bullets={[
        'Manage courts & simulators (resources)',
        'Manage pricing rules — court/simulator rates and add-on service rates, member and non-member',
      ]}
    />
  )
}
