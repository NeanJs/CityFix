import { App } from '@capacitor/app'
import { onUnmounted, watch, type Ref } from 'vue'
import { isNativePlatform } from '../services/platform/isNativePlatform'

export function useAndroidBackHandler(active: Ref<boolean>, onBack: () => void) {
  let listener: { remove: () => Promise<void> } | undefined

  async function detach() {
    if (listener) {
      await listener.remove()
      listener = undefined
    }
  }

  watch(
    active,
    async (isActive) => {
      await detach()
      if (!isActive || !isNativePlatform()) {
        return
      }
      listener = await App.addListener('backButton', () => {
        if (active.value) {
          onBack()
        }
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    detach()
  })
}
