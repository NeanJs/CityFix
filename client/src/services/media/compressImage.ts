import { asFormFile } from './formFile'

const maxEdge = 1280
const quality = 0.78

export function dataUrlFromBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('read'))
    reader.readAsDataURL(blob)
  })
}

export async function compressImageFile(file: File): Promise<File> {
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
  if (typeof canvas.toBlob !== 'function') {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const comma = dataUrl.indexOf(',')
    if (comma < 0) {
      throw new Error('blob')
    }
    const binary = atob(dataUrl.slice(comma + 1))
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return asFormFile(new Blob([bytes], { type: 'image/jpeg' }), 'photo.jpg')
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
          return
        }
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const comma = dataUrl.indexOf(',')
        if (comma < 0) {
          reject(new Error('blob'))
          return
        }
        const binary = atob(dataUrl.slice(comma + 1))
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index)
        }
        resolve(new Blob([bytes], { type: 'image/jpeg' }))
      },
      'image/jpeg',
      quality,
    )
  })
  return asFormFile(blob, 'photo.jpg')
}
