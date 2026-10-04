import { nextTick, type Ref } from 'vue'
import { flipLayout } from './flip'

export function useFlipGroup(
  container: Ref<HTMLElement | null>,
  selector = '[data-flip-item]',
) {
  async function animate(
    mutate: () => void | Promise<void>,
    options: { absolute?: boolean; nested?: boolean } = {},
  ) {
    const root = container.value
    if (!root) {
      await mutate()
      await nextTick()
      return
    }
    await flipLayout({
      targets: root.querySelectorAll(selector),
      mutate,
      absolute: options.absolute ?? true,
      nested: options.nested,
    })
  }

  return { animate }
}

export type FlipGroupAnimate = ReturnType<typeof useFlipGroup>['animate']
