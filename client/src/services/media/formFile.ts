function typeFromName(filename: string) {
  if (filename.endsWith('.png')) {
    return 'image/png'
  }
  if (filename.endsWith('.webp')) {
    return 'image/webp'
  }
  if (filename.endsWith('.mp4')) {
    return 'audio/mp4'
  }
  if (filename.endsWith('.mp3')) {
    return 'audio/mpeg'
  }
  if (filename.endsWith('.webm')) {
    return 'audio/webm'
  }
  return 'image/jpeg'
}

export function isAnalyzeImage(blob: Blob | undefined | null) {
  if (!blob || blob.size < 1) {
    return false
  }
  const type = blob.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp') {
    return true
  }
  if (blob instanceof File) {
    const name = blob.name.toLowerCase()
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')
  }
  return false
}

export function photoFileName(blob: Blob) {
  if (blob instanceof File && blob.name.trim()) {
    return blob.name
  }
  if (blob.type.includes('png')) {
    return 'photo.png'
  }
  if (blob.type.includes('webp')) {
    return 'photo.webp'
  }
  return 'photo.jpg'
}

export function audioFileName(blob: Blob) {
  if (blob instanceof File && blob.name.trim()) {
    return blob.name
  }
  if (blob.type.includes('mp4')) {
    return 'voice.mp4'
  }
  if (blob.type.includes('mpeg')) {
    return 'voice.mp3'
  }
  return 'voice.webm'
}

export function asFormFile(blob: Blob, filename: string) {
  const type = blob.type || typeFromName(filename)
  if (blob instanceof File && blob.name.trim() && blob.type === type) {
    return blob
  }
  return new File([blob], filename, { type })
}

export function fileFromDataUrl(dataUrl: string, filename: string) {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) {
    throw new Error('data-url')
  }
  const header = dataUrl.slice(0, comma)
  const payload = dataUrl.slice(comma + 1)
  const mime = /data:([^;]+)/i.exec(header)?.[1]?.trim() || typeFromName(filename)
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], filename, { type: mime })
}

export function appendFormFile(body: FormData, field: string, blob: Blob, filename: string) {
  const file = asFormFile(blob, filename)
  body.append(field, file, file.name)
}
