<template>
  <div class="scene" aria-hidden="true" />
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 90% 55% at 12% 8%, rgba(125, 94, 48, 0.11), transparent 58%),
    radial-gradient(ellipse 70% 50% at 88% 18%, rgba(47, 61, 82, 0.09), transparent 55%),
    radial-gradient(ellipse 80% 45% at 50% 100%, rgba(125, 94, 48, 0.07), transparent 52%),
    linear-gradient(165deg, var(--bg-top) 0%, #ebe6df 48%, var(--bg-bottom) 100%);
}
</style>
