import {
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

const skeletonHoldMs = 1000

export function useSkeletonHold(settled: MaybeRefOrGetter<boolean>): Ref<boolean> {
  const holdComplete = ref(false)
  const showSkeleton = ref(true)
  let timer = 0

  onMounted(() => {
    timer = window.setTimeout(() => {
      holdComplete.value = true
    }, skeletonHoldMs)
  })

  watch(
    () => holdComplete.value && toValue(settled),
    (canReveal) => {
      if (canReveal) {
        showSkeleton.value = false
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    window.clearTimeout(timer)
  })

  return showSkeleton
}
