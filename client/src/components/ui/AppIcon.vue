<script setup lang="ts">
import {
  PhArrowsClockwise,
  PhCamera,
  PhCheck,
  PhCheckCircle,
  PhChartLineUp,
  PhClipboardText,
  PhCopy,
  PhCrosshair,
  PhGauge,
  PhHouse,
  PhImages,
  PhKeyboard,
  PhMagnifyingGlass,
  PhMapTrifold,
  PhMicrophone,
  PhPaperPlaneTilt,
  PhPlus,
  PhSignIn,
  PhSignOut,
  PhTray,
  PhX,
} from '@phosphor-icons/vue'
import type { Component } from 'vue'
import { computed } from 'vue'

export type AppIconName =
  | 'house'
  | 'home'
  | 'gauge'
  | 'dashboard'
  | 'plus'
  | 'report'
  | 'clipboardText'
  | 'copy'
  | 'reports'
  | 'x'
  | 'check'
  | 'signIn'
  | 'signOut'
  | 'camera'
  | 'images'
  | 'microphone'
  | 'crosshair'
  | 'magnifyingGlass'
  | 'mapTrifold'
  | 'tray'
  | 'paperPlaneTilt'
  | 'keyboard'
  | 'voice'
  | 'insights'
  | 'arrowsClockwise'
  | 'checkCircle'

export type AppIconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'

const icons: Record<AppIconName, Component> = {
  house: PhHouse,
  home: PhHouse,
  gauge: PhGauge,
  dashboard: PhGauge,
  plus: PhPlus,
  report: PhPlus,
  clipboardText: PhClipboardText,
  copy: PhCopy,
  reports: PhClipboardText,
  x: PhX,
  check: PhCheck,
  signIn: PhSignIn,
  signOut: PhSignOut,
  camera: PhCamera,
  images: PhImages,
  microphone: PhMicrophone,
  crosshair: PhCrosshair,
  magnifyingGlass: PhMagnifyingGlass,
  mapTrifold: PhMapTrifold,
  tray: PhTray,
  paperPlaneTilt: PhPaperPlaneTilt,
  keyboard: PhKeyboard,
  voice: PhMicrophone,
  insights: PhChartLineUp,
  arrowsClockwise: PhArrowsClockwise,
  checkCircle: PhCheckCircle,
}

const props = withDefaults(
  defineProps<{
    name: AppIconName
    size?: string
    weight?: AppIconWeight
  }>(),
  {
    size: '1.2rem',
    weight: 'regular',
  },
)

const icon = computed(() => icons[props.name])
const iconSize = computed(() => props.size)
</script>

<template>
  <component
    :is="icon"
    class="app-icon"
    size="100%"
    :weight="props.weight"
    aria-hidden="true"
  />
</template>

<style scoped>
.app-icon {
  display: block;
  flex-shrink: 0;
  width: v-bind(iconSize);
  height: v-bind(iconSize);
  overflow: hidden;
  color: currentColor;
}
</style>
