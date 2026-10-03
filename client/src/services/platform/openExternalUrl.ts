import { Browser } from '@capacitor/browser'
import { isNativePlatform } from './isNativePlatform'

export async function openExternalUrl(url: string) {
  if (isNativePlatform()) {
    await Browser.open({ url })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
