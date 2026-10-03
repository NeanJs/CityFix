<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView } from 'vue-router'
import type { NavItem } from '../../config/nav'
import { useAndroidBackHandler } from '../../composables/useAndroidBackHandler'
import { useIssues } from '../../composables/useIssues'
import { useLocale } from '../../composables/useLocale'
import IssueDetailSheet from '../IssueDetailSheet.vue'
import BottomNav from './BottomNav.vue'
import SideNav from './SideNav.vue'

const props = defineProps<{
  items: readonly NavItem[]
  sectionKey: string
  taglineKey: string
  navAriaKey: string
  canManageStatus: boolean
}>()

const { t } = useLocale()
const { getIssue, updateStatus } = useIssues()

const selectedIssueId = ref<string | null>(null)
const detailOpen = ref(false)

const selectedIssue = computed(() => {
  if (!selectedIssueId.value) {
    return null
  }
  return getIssue(selectedIssueId.value) ?? null
})

const navAriaLabel = computed(() => t(props.navAriaKey))

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
  <div class="workspace">
    <div class="shell">
      <SideNav
        :items="props.items"
        :section-key="props.sectionKey"
        :tagline-key="props.taglineKey"
        :ariaLabel="navAriaLabel"
      />
      <div class="content">
        <main class="main">
          <RouterView v-slot="{ Component }">
            <component :is="Component" @open-issue="openIssue" />
          </RouterView>
        </main>
      </div>
    </div>

    <BottomNav :items="props.items" :ariaLabel="t('nav.primary')" />

    <IssueDetailSheet
      :open="detailOpen"
      :issue="selectedIssue"
      :can-manage-status="props.canManageStatus"
      @close="closeDetail"
      @status-change="(id, status) => updateStatus(id, status)"
    />
  </div>
</template>

<style scoped>
.workspace {
  position: relative;
  z-index: 1;
}

.shell {
  min-height: 100svh;
}

@media (min-width: 1024px) {
  .shell {
    display: grid;
    grid-template-columns: 14.5rem minmax(0, 1fr);
    align-items: start;
  }
}

.content {
  min-width: 0;
}

.main {
  width: 100%;
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 0.9rem
    calc(7.25rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 1024px) {
  .main {
    padding: calc(1.1rem + env(safe-area-inset-top, 0px)) 1.5rem 1.5rem;
  }
}
</style>
