<template>
  <div class="scene" aria-hidden="true">
    <div class="wash" />
    <div class="band" />
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: linear-gradient(168deg, var(--bg-top) 0%, var(--bg) 52%, var(--bg-bottom) 100%);
}

.wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(72% 42% at 8% 0%, rgba(18, 24, 32, 0.08), transparent 58%),
    radial-gradient(58% 36% at 100% 6%, rgba(138, 106, 56, 0.1), transparent 54%);
}

.band {
  position: absolute;
  top: 16%;
  left: -10%;
  width: 62%;
  height: 14%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
  transform: translate3d(0, 0, 0);
  animation: drift 22s ease-in-out infinite alternate;
}

@keyframes drift {
  to {
    transform: translate3d(6%, -8%, 0);
  }
}
</style>
