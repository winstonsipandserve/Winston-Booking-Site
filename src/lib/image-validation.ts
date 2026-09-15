import sharp from 'sharp'

const MAX_IMAGE_PIXELS = 25_000_000
const MAX_IMAGE_DIMENSION = 10_000
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024

const IMAGE_TYPES = {
  'image/jpeg': { format: 'jpeg', extension: 'jpg' },
  'image/png': { format: 'png', extension: 'png' },
} as const

type SupportedImageType = keyof typeof IMAGE_TYPES

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

export type SanitizedImage = {
  contentType: SupportedImageType
  extension: string
  data: Buffer
}

function isSupportedImageType(contentType: string): contentType is SupportedImageType {
  return contentType in IMAGE_TYPES
}

// Retained for the lower-risk public-news cover-image path. Membership documents use
// sanitizeMembershipApplicationImage below, which performs full decode/re-encode.
export async function hasExpectedImageSignature(file: File): Promise<boolean> {
  const prefix = new Uint8Array(await file.slice(0, PNG_SIGNATURE.length).arrayBuffer())

  if (file.type === 'image/jpeg') {
    return JPEG_SIGNATURE.every((byte, index) => prefix[index] === byte)
  }
  if (file.type === 'image/png') {
    return PNG_SIGNATURE.every((byte, index) => prefix[index] === byte)
  }
  return false
}

/**
 * Fully decodes and re-encodes an untrusted membership-document image. This rejects
 * files that merely spoof an image signature, constrains decompression work, removes
 * EXIF/XMP metadata, and ensures only known JPEG/PNG bytes reach private storage.
 */
export async function sanitizeMembershipApplicationImage(file: File): Promise<SanitizedImage> {
  if (!isSupportedImageType(file.type)) {
    throw new Error('must be a JPEG or PNG image')
  }

  const expected = IMAGE_TYPES[file.type]
  const image = sharp(Buffer.from(await file.arrayBuffer()), {
    failOn: 'warning',
    limitInputPixels: MAX_IMAGE_PIXELS,
    pages: 1,
    sequentialRead: true,
  })

  const metadata = await image.metadata()
  if (metadata.format !== expected.format) {
    throw new Error('content does not match its declared file type')
  }
  if (!metadata.width || !metadata.height) {
    throw new Error('could not be decoded as an image')
  }
  if (
    metadata.width > MAX_IMAGE_DIMENSION ||
    metadata.height > MAX_IMAGE_DIMENSION ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error('dimensions are too large')
  }

  const normalized = image.rotate()
  const data =
    file.type === 'image/jpeg'
      ? await normalized.jpeg({ quality: 90, mozjpeg: true }).toBuffer()
      : await normalized.png({ compressionLevel: 9 }).toBuffer()

  if (data.length > MAX_OUTPUT_BYTES) {
    throw new Error('is too large after processing')
  }

  return { contentType: file.type, extension: expected.extension, data }
}
