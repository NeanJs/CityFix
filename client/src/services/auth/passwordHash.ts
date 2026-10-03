export async function hashPassword(password: string): Promise<string> {
  const payload = new TextEncoder().encode(`cityfix.v1:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', payload)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
