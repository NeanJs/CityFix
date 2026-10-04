<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { NavItem } from '../../config/nav'
import { useAndroidBackHandler } from '../../composables/useAndroidBackHandler'
import { useAuth } from '../../composables/useAuth'
import { useIssues } from '../../composables/useIssues'
import { useLocale } from '../../composables/useLocale'
import type { IssueStatus } from '../../types/issue'
import IssueDetailSheet from '../IssueDetailSheet.vue'
import BottomNav from './BottomNav.vue'
import PageSwitch from './PageSwitch.vue'
import SideNav from './SideNav.vue'

const props = defineProps<{
  items: readonly NavItem[]
  sectionKey: string
  taglineKey: string
  navAriaKey: string
  canManageStatus: boolean
}>()

const { t } = useLocale()
const { reporterId } = useAuth()
const { getIssue, loadStaffReports, loadStaffReport, updateStatus, syncTrackedReport } = useIssues()

const selectedIssueId = ref<string | null>(null)
const detailOpen = ref(false)
const statusError = ref('')

const selectedIssue = computed(() => {
  if (!selectedIssueId.value) {
    return null
  }
  return getIssue(selectedIssueId.value) ?? null
})

const navAriaLabel = computed(() => t(props.navAriaKey))

async function refreshIssueFromRemote() {
  const issue = selectedIssue.value
  if (!issue) {
    return
  }
  try {
    if (props.canManageStatus && issue.remoteId) {
      await loadStaffReport(issue.remoteId)
      return
    }
    if (issue.trackingId) {
      await syncTrackedReport(issue.trackingId, reporterId.value)
    }
  } catch {
    /* keep local issue; sheet already open */
  }
}

function openIssue(id: string) {
  selectedIssueId.value = id
  detailOpen.value = true
  statusError.value = ''
  void refreshIssueFromRemote()
}

async function changeStatus(id: string, status: IssueStatus) {
  statusError.value = ''
  const ok = await updateStatus(id, status)
  if (!ok) {
    statusError.value = t('adminHome.statusFailed')
  }
}

function closeDetail() {
  detailOpen.value = false
}

useAndroidBackHandler(detailOpen, closeDetail)

onMounted(() => {
  if (props.canManageStatus) {
    void loadStaffReports()
  }
})
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
          <PageSwitch layer="workspace" @open-issue="openIssue" />
        </main>
      </div>
    </div>

    <BottomNav :items="props.items" :ariaLabel="t('nav.primary')" />

    <IssueDetailSheet
      :open="detailOpen"
      :issue="selectedIssue"
      :can-manage-status="props.canManageStatus"
      :status-error="statusError"
      @close="closeDetail"
      @status-change="changeStatus"
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
