<template>
  <div class="scene" aria-hidden="true">
    <div class="orb orb-a" />
    <div class="orb orb-b" />
    <div class="orb orb-c" />
    <div class="grid" />
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(45, 212, 191, 0.22), transparent 55%),
    radial-gradient(90% 60% at 100% 30%, rgba(56, 189, 248, 0.16), transparent 50%),
    linear-gradient(165deg, var(--bg-top) 0%, var(--bg) 45%, var(--bg-bottom) 100%);
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  opacity: 0.75;
  transform: translate3d(0, 0, 0);
}

.orb-a {
  width: min(420px, 70vw);
  height: min(420px, 70vw);
  top: -8%;
  left: -12%;
  background: rgba(13, 148, 136, 0.45);
  animation: drift-a 18s ease-in-out infinite alternate;
}

.orb-b {
  width: min(360px, 55vw);
  height: min(360px, 55vw);
  top: 38%;
  right: -18%;
  background: rgba(14, 165, 233, 0.35);
  animation: drift-b 22s ease-in-out infinite alternate;
}

.orb-c {
  width: min(280px, 45vw);
  height: min(280px, 45vw);
  bottom: 8%;
  left: 20%;
  background: rgba(99, 102, 241, 0.28);
  animation: drift-c 20s ease-in-out infinite alternate;
}

.grid {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, #000 20%, transparent 75%);
}

@keyframes drift-a {
  to {
    transform: translate(6%, 8%) scale(1.06);
  }
}

@keyframes drift-b {
  to {
    transform: translate(-5%, -6%) scale(1.08);
  }
}

@keyframes drift-c {
  to {
    transform: translate(4%, -5%) scale(0.95);
  }
}
</style>
