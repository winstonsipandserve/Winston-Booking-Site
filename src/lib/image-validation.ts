const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

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
