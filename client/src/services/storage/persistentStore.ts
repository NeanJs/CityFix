import { Preferences } from '@capacitor/preferences'
import { isNativePlatform } from '../platform/isNativePlatform'

export async function readStoreItem(key: string): Promise<string | null> {
  if (isNativePlatform()) {
    const { value } = await Preferences.get({ key })
    return value
  }
  return localStorage.getItem(key)
}

export async function writeStoreItem(key: string, value: string): Promise<void> {
  if (isNativePlatform()) {
    await Preferences.set({ key, value })
    return
  }
  localStorage.setItem(key, value)
}
