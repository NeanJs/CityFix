import gsap from 'gsap'
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export function useMotionScope(root?: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | undefined

  onMounted(() => {
    ctx = gsap.context(() => undefined, root?.value ?? undefined)
  })

  onBeforeUnmount(() => {
    ctx?.revert()
  })

  function run(fn: () => void) {
    if (!ctx) {
      fn()
      return
    }
    ctx.add(fn)
  }

  return { run }
}
