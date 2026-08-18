// Disposable one-off script — creates the first AdminUser row, then delete this file.
// Edit the placeholders below with your real name/email/password before running:
//   npx dotenv -e .env.local -- tsx prisma/bootstrap-admin.ts

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/admin-auth'

const prisma = new PrismaClient()

async function main() {
  const name = 'Arjay' // CHANGE_ME
  const email = 'CHANGE_ME@example.com' // CHANGE_ME
  const password = 'CHANGE_ME' // CHANGE_ME

  const passwordHash = await hashPassword(password)

  const adminUser = await prisma.adminUser.create({
    data: { name, email, passwordHash },
  })

  console.log(`Created AdminUser ${adminUser.id} (${adminUser.email})`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
