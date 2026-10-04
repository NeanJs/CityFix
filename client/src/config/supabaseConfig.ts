function withScheme(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed.replace(/^\/+/, '')}`
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

export const supabaseUrl = stripTrailingSlash(
  withScheme(import.meta.env.VITE_SUPABASE_URL ?? ''),
)

export const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey)
}
