<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useIssues } from '../../composables/useIssues'
import { useLocale } from '../../composables/useLocale'
import IssueCard from '../../components/IssueCard.vue'
import IssuesMap from '../../components/IssuesMap.vue'
import AppHeader from '../../components/layout/AppHeader.vue'
import SpeakButton from '../../components/SpeakButton.vue'
import GlassPanel from '../../components/ui/GlassPanel.vue'
import { compareQueuePriority, nextStatus } from '../../services/report/statusFlow'

type DeskFilter = 'open' | 'high' | 'resolved' | 'all'

const { issues, openCount, resolvedCount, highSeverityCount, issuesCreatedOn, updateStatus } =
  useIssues()
const { t } = useLocale()
const router = useRouter()

const filter = ref<DeskFilter>('open')
const mapOpen = ref(
  typeof window !== 'undefined' && window.matchMedia('(min-width: 720px)').matches,
)
const mapRef = ref<{ resizeMap: () => void } | null>(null)

const briefing = computed(() => {
  const today = issuesCreatedOn(new Date())
  return t('adminHome.briefingSpeech', {
    count: today.length,
    high: today.filter((issue) => issue.severity === 'high').length,
  })
})

const mappedIssues = computed(() =>
  issues.value.filter(
    (issue) => issue.latitude !== undefined && issue.longitude !== undefined,
  ),
)

const queue = computed(() => {
  const items = issues.value.filter((issue) => {
    if (filter.value === 'open') {
      return issue.status !== 'resolved'
    }
    if (filter.value === 'high') {
      return issue.severity === 'high'
    }
    if (filter.value === 'resolved') {
      return issue.status === 'resolved'
    }
    return true
  })
  return [...items].sort(compareQueuePriority)
})

const emit = defineEmits<{
  openIssue: [id: string]
}>()

const filterItems = computed(() => [
  { id: 'open' as const, labelKey: 'adminHome.open', value: openCount.value },
  { id: 'high' as const, labelKey: 'adminHome.highSeverity', value: highSeverityCount.value },
  { id: 'resolved' as const, labelKey: 'adminHome.resolved', value: resolvedCount.value },
  { id: 'all' as const, labelKey: 'adminHome.onRecord', value: issues.value.length },
])

async function advanceIssue(id: string) {
  const issue = issues.value.find((item) => item.id === id)
  if (!issue) {
    return
  }
  const upcoming = nextStatus(issue.status)
  if (upcoming) {
    await updateStatus(id, upcoming)
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

    <div class="stats">
      <button
        v-for="item in filterItems"
        :key="item.id"
        type="button"
        class="stat"
        :class="{ active: filter === item.id }"
        @click="filter = item.id"
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
            <SpeakButton
              class="briefing"
              :text="briefing"
              play-key="adminHome.playBriefing"
              playing-key="adminHome.playingBriefing"
              unavailable-key="adminHome.briefingUnavailable"
            />
            <button type="button" class="btn-ghost" @click="router.push('/admin/reports')">
              {{ t('adminHome.viewLedger') }}
            </button>
          </div>
        </div>

        <GlassPanel v-if="queue.length === 0" padding="lg" tone="paper" class="empty">
          <p class="empty-title">{{ t('adminHome.emptyTitle') }}</p>
          <p class="hint">{{ t('adminHome.emptyHint') }}</p>
        </GlassPanel>

        <div v-else class="list">
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

      <GlassPanel padding="sm" tone="paper" class="map-panel" :class="{ collapsed: !mapOpen }">
        <div class="map-head">
          <h2 class="section-title">{{ t('adminHome.map') }}</h2>
          <button type="button" class="btn-ghost map-toggle" @click="toggleMap">
            {{ mapOpen ? t('adminHome.hideMap') : t('adminHome.showMap') }}
          </button>
        </div>
        <div v-show="mapOpen" class="map-body">
          <IssuesMap ref="mapRef" :issues="mappedIssues" @select="emit('openIssue', $event)" />
        </div>
      </GlassPanel>
    </div>
  </section>
</template>

<style scoped>
.desk {
  display: grid;
  gap: 0.85rem;
}

.stats {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.stats::-webkit-scrollbar {
  display: none;
}

.stat {
  display: grid;
  gap: 0.1rem;
  justify-items: start;
  flex: 1 0 6.25rem;
  min-height: 3.1rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: inherit;
  cursor: pointer;
}

.stat.active {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 750;
  color: var(--text-h);
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 650;
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
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-h);
  font-family: var(--font-display);
}

.map-body {
  height: 14rem;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
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

.briefing {
  display: none;
}

.empty {
  display: grid;
  gap: 0.4rem;
}

.empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-h);
}

.list {
  display: grid;
  gap: 0.55rem;
}

@media (min-width: 720px) {
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: visible;
  }

  .map-toggle {
    display: none;
  }

  .map-body {
    display: block !important;
  }

  .briefing {
    display: grid;
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
