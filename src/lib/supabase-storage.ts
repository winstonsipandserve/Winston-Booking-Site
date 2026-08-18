function getStorageEnv() {
  const url = process.env.SUPABASE_URL
  if (!url) throw new Error('SUPABASE_URL is not set')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return { url, serviceRoleKey }
}

export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File,
): Promise<{ path: string }> {
  const { url, serviceRoleKey } = getStorageEnv()

  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': file.type,
    },
    body: await file.arrayBuffer(),
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Failed to upload to storage bucket "${bucket}" at "${path}": ${res.status} ${bodyText}`)
  }

  return { path }
}

export async function deleteFromStorage(bucket: string, paths: string[]): Promise<void> {
  const { url, serviceRoleKey } = getStorageEnv()

  await Promise.all(
    paths.map(async (path) => {
      try {
        const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        })
        if (!res.ok) {
          const bodyText = await res.text().catch(() => '')
          console.error(`Failed to delete storage object "${bucket}/${path}": ${res.status} ${bodyText}`)
        }
      } catch (err) {
        console.error(`Failed to delete storage object "${bucket}/${path}":`, err)
      }
    }),
  )
}
