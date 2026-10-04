<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useIssues } from '../../composables/useIssues'
import { useLocale } from '../../composables/useLocale'
import IssueCard from '../../components/IssueCard.vue'
import IssuesMap from '../../components/IssuesMap.vue'
import AppHeader from '../../components/layout/AppHeader.vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import GlassPanel from '../../components/ui/GlassPanel.vue'
import SelectionIndicator from '../../components/ui/SelectionIndicator.vue'
import { useFlipGroup } from '../../motion/useFlipGroup'
import { compareQueuePriority, isOpenStatus, nextStatus } from '../../services/report/statusFlow'

type DeskFilter = 'open' | 'high' | 'resolved' | 'all'

const { issues, openCount, resolvedCount, highSeverityCount, updateStatus, staffLoadStatus, loadStaffReports } =
  useIssues()
const { t } = useLocale()
const router = useRouter()

const filter = ref<DeskFilter>('open')
const mapOpen = ref(
  typeof window !== 'undefined' && window.matchMedia('(min-width: 720px)').matches,
)
const mapRef = ref<{ resizeMap: () => void } | null>(null)
const queueRoot = ref<HTMLElement | null>(null)
const { animate: animateQueue } = useFlipGroup(queueRoot)

const mappedIssues = computed(() =>
  issues.value.filter(
    (issue) => issue.latitude !== undefined && issue.longitude !== undefined,
  ),
)

const queue = computed(() => {
  const items = issues.value.filter((issue) => {
    if (filter.value === 'open') {
      return isOpenStatus(issue.status)
    }
    if (filter.value === 'high') {
      return issue.severity === 'high' && isOpenStatus(issue.status)
    }
    if (filter.value === 'resolved') {
      return issue.status === 'resolved'
    }
    return true
  })
  return [...items].sort(compareQueuePriority)
})

const unlocatedCount = computed(
  () =>
    queue.value.filter(
      (issue) => issue.latitude === undefined || issue.longitude === undefined,
    ).length,
)

const statusError = ref('')

const emit = defineEmits<{
  openIssue: [id: string]
}>()

const filterItems = computed(() => [
  { id: 'open' as const, labelKey: 'adminHome.open', value: openCount.value },
  { id: 'high' as const, labelKey: 'adminHome.highSeverity', value: highSeverityCount.value },
  { id: 'resolved' as const, labelKey: 'adminHome.resolved', value: resolvedCount.value },
  { id: 'all' as const, labelKey: 'adminHome.onRecord', value: issues.value.length },
])

function setFilter(id: DeskFilter) {
  void animateQueue(() => {
    filter.value = id
  })
}

async function advanceIssue(id: string) {
  const issue = issues.value.find((item) => item.id === id)
  if (!issue) {
    return
  }
  const upcoming = nextStatus(issue.status)
  if (!upcoming) {
    return
  }
  statusError.value = ''
  let ok = false
  await animateQueue(async () => {
    ok = await updateStatus(id, upcoming)
  })
  if (!ok) {
    statusError.value = t('adminHome.statusFailed')
  }
}

async function toggleMap() {
  mapOpen.value = !mapOpen.value
  await nextTick()
  mapRef.value?.resizeMap()
}

watch(mapOpen, async () => {
  await nextTick()
  mapRef.value?.resizeMap()
})
</script>

<template>
  <section class="desk">
    <AppHeader :subtitle="t('adminHome.title')" show-account />

    <div class="stats surface-frost">
      <SelectionIndicator :active-key="filter" />
      <button
        v-for="item in filterItems"
        :key="item.id"
        type="button"
        class="stat"
        :class="{ active: filter === item.id }"
        :data-selection-active="filter === item.id ? 'true' : undefined"
        @click="setFilter(item.id)"
      >
        <span class="stat-value">{{ item.value }}</span>
        <span class="stat-label">{{ t(item.labelKey) }}</span>
      </button>
    </div>

    <div class="workspace">
      <div class="queue">
        <div class="section-head">
          <h2 class="section-title">{{ t('adminHome.queue') }}</h2>
          <div class="queue-actions">
            <button type="button" class="btn-ghost" @click="router.push('/admin/reports')">
              <AppIcon name="clipboardText" size="1rem" />
              {{ t('adminHome.viewLedger') }}
            </button>
          </div>
        </div>

        <div ref="queueRoot" class="queue-results">
        <p v-if="staffLoadStatus === 'loading'" class="hint">{{ t('adminHome.loading') }}</p>
        <GlassPanel v-if="staffLoadStatus === 'error'" padding="lg" tone="fill" class="empty">
          <p class="empty-title">{{ t('adminHome.loadFailed') }}</p>
          <button type="button" class="btn" @click="loadStaffReports">
            {{ t('adminHome.retry') }}
          </button>
        </GlassPanel>
        <p v-if="statusError" class="hint" role="alert">{{ statusError }}</p>
        <GlassPanel
          v-if="queue.length === 0 && staffLoadStatus === 'ready'"
          padding="lg"
          tone="fill"
          class="empty"
        >
          <AppIcon class="empty-icon" name="clipboardText" size="1.75rem" />
          <p class="empty-title">{{ t('adminHome.emptyTitle') }}</p>
          <p class="hint">{{ t('adminHome.emptyHint') }}</p>
        </GlassPanel>

        <div v-if="queue.length > 0" class="list">
          <IssueCard
            v-for="issue in queue"
            :key="issue.id"
            :issue="issue"
            show-advance
            @select="emit('openIssue', $event)"
            @advance="advanceIssue"
          />
        </div>
        </div>
      </div>

      <GlassPanel padding="sm" tone="fill" class="map-panel" :class="{ collapsed: !mapOpen }">
        <div class="map-head">
          <h2 class="section-title">{{ t('adminHome.map') }}</h2>
          <button type="button" class="btn-ghost map-toggle" @click="toggleMap">
            <AppIcon name="mapTrifold" size="1rem" />
            {{ mapOpen ? t('adminHome.hideMap') : t('adminHome.showMap') }}
          </button>
        </div>
        <div v-show="mapOpen" class="map-body">
          <IssuesMap ref="mapRef" :issues="mappedIssues" @select="emit('openIssue', $event)" />
        </div>
        <p v-if="mapOpen && unlocatedCount > 0" class="hint map-hint">
          {{ t('adminHome.mapUnlocated', { count: unlocatedCount }) }}
        </p>
      </GlassPanel>
    </div>
  </section>
</template>

<style scoped>
.desk {
  display: grid;
  gap: 1.5rem;
}

.stats {
  position: relative;
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 1.1rem 0.2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: inset 0 2px 0 var(--civic-bar);
}

.stats :deep(.indicator.fill) {
  border-radius: var(--radius-md);
}

.stats::-webkit-scrollbar {
  display: none;
}

.stat {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.2rem;
  justify-items: start;
  flex: 1 0 6.5rem;
  padding: 0.25rem 0.85rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.stat.active .stat-value {
  color: var(--text-h);
}

.stat-value {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.88rem;
  font-weight: 400;
  color: var(--text-muted);
}

.workspace {
  display: grid;
  gap: 0.85rem;
}

.map-panel {
  display: grid;
  gap: 0.5rem;
}

.map-head,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.section-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-h);
}

.map-body {
  height: 14rem;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.map-hint {
  margin: 0.45rem 0.15rem 0;
}

.queue {
  display: grid;
  gap: 0.65rem;
  min-width: 0;
}

.queue-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}

.queue-results {
  display: grid;
  gap: 0.65rem;
}

.empty {
  display: grid;
  gap: 0.4rem;
}

.empty-icon {
  color: var(--text-muted);
}

.empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-h);
}

.list {
  display: grid;
  gap: 0.65rem;
}

@media (min-width: 720px) {
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: visible;
  }
}

@media (min-width: 1024px) {
  .workspace {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    align-items: start;
    min-height: calc(100svh - 8rem);
  }

  .map-panel {
    order: -1;
    min-height: 100%;
    grid-template-rows: auto 1fr;
  }

  .map-body {
    height: auto;
    min-height: 28rem;
  }

  .queue {
    max-height: calc(100svh - 10rem);
    overflow: auto;
  }
}
</style>
