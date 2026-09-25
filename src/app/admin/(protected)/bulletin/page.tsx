import { permanentRedirect } from 'next/navigation'

export default function AdminBulletinPage() {
  permanentRedirect('/admin/announcements')
}
