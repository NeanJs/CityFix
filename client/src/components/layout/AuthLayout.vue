<script setup lang="ts">
import { RouterView } from 'vue-router'
import { appName } from '../../config/appConfig'
</script>

<template>
  <div class="auth-shell">
    <header class="auth-head">
      <div class="brand">
        <div class="mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2.5 4 8v8l8 5.5L20 16V8l-8-5.5Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <path
              d="M12 11.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>
          <p class="name">{{ appName }}</p>
          <span class="civic-rule" aria-hidden="true" />
        </div>
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
  align-items: center;
  gap: 0.65rem;
}

.mark {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  color: var(--civic-bar);
}

.mark svg {
  width: 1.2rem;
  height: 1.2rem;
}

.name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-h);
  font-family: var(--font-display);
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
