<script setup lang="ts">
withDefaults(
  defineProps<{
    withThumb?: boolean
  }>(),
  {
    withThumb: true,
  },
)
</script>

<template>
  <div class="skeleton-card surface-frost" aria-hidden="true">
    <div class="body">
      <div v-if="withThumb" class="thumb skeleton-bone" />
      <div class="copy">
        <div class="topline">
          <span class="title skeleton-bone" />
          <span class="pill skeleton-bone" />
        </div>
        <span class="location skeleton-bone" />
        <div class="meta">
          <span class="stamp skeleton-bone" />
          <span class="chip skeleton-bone" />
          <span class="when skeleton-bone" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: inset 3px 0 0 var(--civic-bar);
  pointer-events: none;
}

.body {
  display: flex;
  gap: 0.85rem;
  align-items: stretch;
}

.thumb {
  flex-shrink: 0;
  width: 4.5rem;
  min-height: 4.5rem;
  border-radius: var(--radius-md);
}

.copy {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 0.4rem;
  align-content: start;
}

.topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

.title {
  height: 0.95rem;
  width: 62%;
}

.pill {
  flex-shrink: 0;
  width: 4.4rem;
  height: 1.2rem;
  border-radius: var(--radius-pill);
}

.location {
  height: 0.72rem;
  width: 48%;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.stamp {
  width: 5.5rem;
  height: 0.7rem;
}

.chip {
  width: 3.4rem;
  height: 1rem;
  border-radius: var(--radius-pill);
}

.when {
  width: 3rem;
  height: 0.7rem;
}

@media (min-width: 720px) {
  .thumb {
    width: 5.5rem;
  }
}
</style>
