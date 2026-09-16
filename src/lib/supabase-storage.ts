import type { SanitizedImage } from '@/lib/image-validation'

type SignedUploadUrlResponse = {
  url: string
}

type StorageObject = {
  name: string
  created_at?: string
  updated_at?: string
}

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
  file: File | SanitizedImage,
): Promise<{ path: string }> {
  const { url, serviceRoleKey } = getStorageEnv()

  const isSanitizedImage = 'data' in file
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': isSanitizedImage ? file.contentType : file.type,
    },
    body: isSanitizedImage ? new Blob([Uint8Array.from(file.data)]) : await file.arrayBuffer(),
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Failed to upload to storage bucket "${bucket}" at "${path}": ${res.status} ${bodyText}`)
  }

  return { path }
}

/**
 * Creates a single-use upload capability for one object path. The service key stays
 * on the server; callers may only PUT to this exact URL while it remains valid.
 */
export async function createSignedUploadUrl(bucket: string, path: string): Promise<string> {
  const { url, serviceRoleKey } = getStorageEnv()
  const res = await fetch(`${url}/storage/v1/object/upload/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Failed to create a signed upload URL: ${res.status} ${bodyText}`)
  }

  const body = (await res.json()) as SignedUploadUrlResponse
  if (!body.url.startsWith('/')) {
    throw new Error('Storage returned an invalid signed upload URL')
  }
  return `${url}/storage/v1${body.url}`
}

export async function downloadFromStorage(bucket: string, path: string): Promise<Buffer> {
  const { url, serviceRoleKey } = getStorageEnv()
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    headers: { Authorization: `Bearer ${serviceRoleKey}` },
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Failed to download storage object "${bucket}/${path}": ${res.status} ${bodyText}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

export async function listStorageObjects(bucket: string, prefix: string): Promise<StorageObject[]> {
  const { url, serviceRoleKey } = getStorageEnv()
  const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: 'created_at', order: 'asc' } }),
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Failed to list storage objects in "${bucket}/${prefix}": ${res.status} ${bodyText}`)
  }
  return (await res.json()) as StorageObject[]
}

export function getPublicUrl(bucket: string, path: string): string {
  const { url } = getStorageEnv()
  return `${url}/storage/v1/object/public/${bucket}/${path}`
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { url, serviceRoleKey } = getStorageEnv()

  const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Failed to sign URL for "${bucket}/${path}": ${res.status} ${bodyText}`)
  }

  const { signedURL } = (await res.json()) as { signedURL: string }
  return `${url}/storage/v1${signedURL}`
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
