const maxEdge = 1280
const quality = 0.78

export async function compressImageFile(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('canvas')
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}
