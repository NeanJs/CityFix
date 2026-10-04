<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppLogo from './AppLogo.vue'
</script>

<template>
  <div class="auth-shell">
    <header class="auth-head">
      <div class="brand">
        <AppLogo variant="auth" />
        <span class="civic-rule" aria-hidden="true" />
      </div>
    </header>
    <main class="auth-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.auth-shell {
  position: relative;
  z-index: 1;
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr;
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 0.9rem
    calc(1.2rem + env(safe-area-inset-bottom, 0px));
}

.auth-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: -0.9rem;
  right: -0.9rem;
  height: 4rem;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(180deg, rgba(125, 94, 48, 0.032), transparent 88%);
  mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
}

.auth-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.85rem;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
  width: min(17.5rem, 100%);
}

.auth-main {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  justify-items: center;
  padding-top: 1.5rem;
}

.auth-main::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    ellipse 100% 88% at 50% 42%,
    transparent 72%,
    rgba(47, 61, 82, 0.018) 100%
  );
}

.auth-main > :deep(*) {
  position: relative;
  z-index: 1;
}

@media (min-width: 720px) {
  .auth-main {
    align-content: center;
    padding-top: 0;
  }
}
</style>
