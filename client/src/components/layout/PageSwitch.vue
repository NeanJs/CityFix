<script setup lang="ts">
import { useAttrs } from 'vue'
import { RouterView } from 'vue-router'
import { enterPage, leavePage, type PageMotionLayer } from '../../motion/pageTransition'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  layer: PageMotionLayer
}>()

const attrs = useAttrs()

function onLeave(element: Element, done: () => void) {
  leavePage(element as HTMLElement, props.layer, done)
}

function onEnter(element: Element, done: () => void) {
  enterPage(element as HTMLElement, props.layer, done)
}
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :css="false" mode="out-in" @leave="onLeave" @enter="onEnter">
      <component
        :is="Component"
        v-if="Component"
        :key="
          layer === 'layout'
            ? (route.matched[0]?.path ?? route.path)
            : String(route.name ?? route.path)
        "
        v-bind="attrs"
      />
    </Transition>
  </RouterView>
</template>
