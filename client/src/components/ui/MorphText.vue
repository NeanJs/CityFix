<script setup lang="ts">
import gsap from 'gsap'
import { onMounted, ref, watch } from 'vue'
import { easings } from '../../motion/easings'
import { duration } from '../../motion/tokens'
import { useMotionScope } from '../../motion/useMotionScope'

const props = defineProps<{
  text: string
}>()

const el = ref<HTMLElement | null>(null)
const shown = ref(props.text)
const { run } = useMotionScope(el)

function swap(next: string) {
  const node = el.value
  if (!node) {
    shown.value = next
    return
  }
  run(() => {
    gsap.killTweensOf(node)
    gsap
      .timeline({ overwrite: 'auto' })
      .to(node, { opacity: 0, y: 4, duration: duration.xs, ease: easings.primary })
      .add(() => {
        shown.value = next
      })
      .fromTo(
        node,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: duration.xs, ease: easings.primary },
      )
  })
}

watch(
  () => props.text,
  (next) => {
    if (next === shown.value) {
      return
    }
    swap(next)
  },
)

onMounted(() => {
  shown.value = props.text
})
</script>

<template>
  <span ref="el" class="morph">{{ shown }}</span>
</template>

<style scoped>
.morph {
  display: inline-block;
}
</style>
