import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '../../config/supabaseConfig'
import { readStoreItem, removeStoreItem, writeStoreItem } from '../storage/persistentStore'

const supabaseAuthStorage: SupportedStorage = {
  getItem: (key) => readStoreItem(key),
  setItem: (key, value) => writeStoreItem(key, value),
  removeItem: (key) => removeStoreItem(key),
}

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client
  }
  if (!isSupabaseConfigured()) {
    throw new Error('unavailable')
  }
  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: supabaseAuthStorage,
    },
  })
  return client
}
