<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'
import IssueDetailSheet from './components/IssueDetailSheet.vue'
import BackgroundScene from './components/layout/BackgroundScene.vue'
import BottomNav from './components/layout/BottomNav.vue'
import SideNav from './components/layout/SideNav.vue'
import { useAndroidBackHandler } from './composables/useAndroidBackHandler'
import { useIssues } from './composables/useIssues'

const { storeReady, getIssue, updateStatus } = useIssues()

const selectedIssueId = ref<string | null>(null)
const detailOpen = ref(false)

const selectedIssue = computed(() => {
  if (!selectedIssueId.value) {
    return null
  }
  return getIssue(selectedIssueId.value) ?? null
})

function openIssue(id: string) {
  selectedIssueId.value = id
  detailOpen.value = true
}

function closeDetail() {
  detailOpen.value = false
}

useAndroidBackHandler(detailOpen, closeDetail)
</script>

<template>
  <div v-if="!storeReady" class="boot" aria-live="polite">
    <p>Loading workspace…</p>
  </div>
  <div v-else class="app">
    <BackgroundScene />

    <div class="shell">
      <SideNav />
      <div class="content">
        <main class="main">
          <RouterView v-slot="{ Component }">
            <component :is="Component" @open-issue="openIssue" />
          </RouterView>
        </main>
      </div>
    </div>

    <BottomNav />

    <IssueDetailSheet
      :open="detailOpen"
      :issue="selectedIssue"
      @close="closeDetail"
      @status-change="(id, status) => updateStatus(id, status)"
    />
  </div>
</template>

<style scoped>
.boot {
  min-height: 100svh;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-weight: 600;
}

.app {
  position: relative;
  min-height: 100svh;
  isolation: isolate;
}

.shell {
  position: relative;
  z-index: 1;
  min-height: 100svh;
  max-width: 88rem;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .shell {
    display: grid;
    grid-template-columns: 15.5rem minmax(0, 1fr);
  }
}

.content {
  min-width: 0;
}

.main {
  width: 100%;
  padding: calc(0.85rem + env(safe-area-inset-top, 0px)) 1rem
    calc(6.25rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 1024px) {
  .main {
    padding: calc(1.25rem + env(safe-area-inset-top, 0px)) 1.75rem 1.75rem;
  }
}
</style>
