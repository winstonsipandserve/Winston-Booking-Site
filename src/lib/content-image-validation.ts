import { hasExpectedImageSignature } from '@/lib/image-validation'

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export async function validateImageFile(value: File): Promise<{ error: string } | { file: File }> {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(value.type)) {
    return { error: 'Image must be a JPEG or PNG image' }
  }
  if (value.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'Image must be 5MB or smaller' }
  }
  if (!(await hasExpectedImageSignature(value))) {
    return { error: 'Image content does not match its declared file type' }
  }
  return { file: value }
}
