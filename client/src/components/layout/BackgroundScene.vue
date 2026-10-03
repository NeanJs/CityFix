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
  background: linear-gradient(168deg, var(--bg-top) 0%, var(--bg) 48%, var(--bg-bottom) 100%);
}

.wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(80% 48% at 12% 0%, rgba(122, 92, 50, 0.14), transparent 58%),
    radial-gradient(70% 40% at 100% 8%, rgba(28, 36, 48, 0.08), transparent 52%);
}

.band {
  position: absolute;
  top: 18%;
  left: -8%;
  width: 70%;
  height: 18%;
  background: linear-gradient(90deg, transparent, rgba(255, 248, 235, 0.28), transparent);
  transform: translate3d(0, 0, 0);
  animation: drift 22s ease-in-out infinite alternate;
}

@keyframes drift {
  to {
    transform: translate3d(6%, -8%, 0);
  }
}
</style>
