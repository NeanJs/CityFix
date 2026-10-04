<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { issueCategories } from '../data/categories'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import { useFlipGroup } from '../motion/useFlipGroup'
import { apiErrorMessage } from '../services/api/apiRequestError'
import { ReportApiError } from '../services/api/reportsApi'
import type { IssueCategory, IssueStatus } from '../types/issue'
import IssueCard from '../components/IssueCard.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import SeverityPill from '../components/SeverityPill.vue'
import StatusPill from '../components/StatusPill.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'
import MorphText from '../components/ui/MorphText.vue'
import SelectionIndicator from '../components/ui/SelectionIndicator.vue'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const { reporterId } = useAuth()
const { issues, issuesForReporter, getIssueByTrackingId, syncTrackedReport } = useIssues()

const highlightIssueId = computed(() => {
  const value = route.query.highlight
  return typeof value === 'string' ? value : null
})

const isStaffQueue = computed(() => route.meta.issueScope === 'all')

const scopedIssues = computed(() => {
  if (isStaffQueue.value) {
    return issues.value
  }
  return issuesForReporter(reporterId.value)
})

const emit = defineEmits<{
  openIssue: [id: string]
}>()

const statusFilter = ref<'all' | IssueStatus>('all')
const categoryFilter = ref<'all' | IssueCategory>('all')
const query = ref('')
const trackingQuery = ref('')
const tracking = ref(false)
const trackError = ref('')
const resultsRoot = ref<HTMLElement | null>(null)
const { animate: animateResults } = useFlipGroup(resultsRoot)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return scopedIssues.value.filter((issue) => {
    if (statusFilter.value !== 'all' && issue.status !== statusFilter.value) {
      return false
    }
    if (categoryFilter.value !== 'all' && issue.category !== categoryFilter.value) {
      return false
    }
    if (!q) {
      return true
    }
    const haystack =
      `${issue.trackingId} ${issue.title} ${issue.description} ${issue.locationLabel}`.toLowerCase()
    return haystack.includes(q)
  })
})

const statusFilters: { id: 'all' | IssueStatus; labelKey: string }[] = [
  { id: 'all', labelKey: 'reports.statusAll' },
  { id: 'submitted', labelKey: 'status.submitted' },
  { id: 'in_review', labelKey: 'status.in_review' },
  { id: 'scheduled', labelKey: 'status.scheduled' },
  { id: 'resolved', labelKey: 'status.resolved' },
]

function setStatusFilter(id: (typeof statusFilters)[number]['id']) {
  void animateResults(() => {
    statusFilter.value = id
  })
}

function setCategoryFilter(value: 'all' | IssueCategory) {
  void animateResults(() => {
    categoryFilter.value = value
  })
}

function setQuery(value: string) {
  void animateResults(() => {
    query.value = value
  })
}

async function lookupTracking() {
  if (tracking.value) {
    return
  }
  const id = trackingQuery.value.trim()
  if (!id) {
    return
  }
  tracking.value = true
  trackError.value = ''
  try {
    const issue = await syncTrackedReport(id, reporterId.value)
    if (!issue) {
      trackError.value = t('reports.trackUnavailable')
      return
    }
    trackingQuery.value = issue.trackingId
    emit('openIssue', issue.id)
  } catch (error) {
    if (error instanceof ReportApiError && error.code === 'not-found') {
      const local = getIssueByTrackingId(id)
      if (local) {
        emit('openIssue', local.id)
        return
      }
      trackError.value = t('reports.trackMissing')
      return
    }
    trackError.value = apiErrorMessage(error, t, 'reports.trackFailed')
  } finally {
    tracking.value = false
  }
}

watch(
  () => route.query.track,
  (value) => {
    if (typeof value !== 'string' || !value.trim() || tracking.value) {
      return
    }
    trackingQuery.value = value.trim()
    void lookupTracking()
  },
  { immediate: true },
)

function formatFiled(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
</script>

<template>
  <section class="reports">
    <AppHeader
      :subtitle="t(isStaffQueue ? 'reports.staffTitle' : 'reports.citizenTitle')"
      show-account
    />

    <GlassPanel padding="md" tone="fill" class="track-panel">
      <form class="track-form" @submit.prevent="lookupTracking">
        <div class="track-copy">
          <p class="field-label">{{ t('reports.trackLabel') }}</p>
          <p class="hint">{{ t('reports.trackHint') }}</p>
        </div>
        <div class="track-controls">
          <label class="track-field">
            <span class="sr-label">{{ t('reports.trackLabel') }}</span>
            <input
              v-model="trackingQuery"
              class="control"
              type="text"
              maxlength="40"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('reports.trackPlaceholder')"
            />
          </label>
          <button type="submit" class="btn" :disabled="tracking || !trackingQuery.trim()">
            <span class="btn-inner">
              <span v-show="tracking" class="spinner" aria-hidden="true" />
              <MorphText :text="tracking ? t('reports.trackSearching') : t('reports.trackSubmit')" />
            </span>
          </button>
        </div>
        <p v-if="trackError" class="track-error" role="alert">{{ trackError }}</p>
      </form>
    </GlassPanel>

    <GlassPanel padding="md" tone="fill" class="toolbar">
      <label class="search">
        <span class="sr-label">{{ t('reports.search') }}</span>
            <input
              class="control"
              type="search"
              :value="query"
              :placeholder="t('reports.searchPlaceholder')"
              @input="setQuery(($event.target as HTMLInputElement).value)"
            />
      </label>

      <div class="chips" role="tablist" :aria-label="t('reports.filterStatus')">
        <SelectionIndicator :active-key="statusFilter" tone="ink" />
        <button
          v-for="item in statusFilters"
          :key="item.id"
          type="button"
          class="chip"
          :class="{ active: statusFilter === item.id }"
          :data-selection-active="statusFilter === item.id ? 'true' : undefined"
          @click="setStatusFilter(item.id)"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>

      <label class="select-wrap">
        <span class="sr-label">{{ t('reports.category') }}</span>
        <select
          class="control"
          :value="categoryFilter"
          @change="setCategoryFilter(($event.target as HTMLSelectElement).value as 'all' | IssueCategory)"
        >
          <option value="all">{{ t('reports.allCategories') }}</option>
          <option v-for="cat in issueCategories" :key="cat.id" :value="cat.id">
            {{ t(`category.${cat.id}`) }}
          </option>
        </select>
      </label>
    </GlassPanel>

    <div ref="resultsRoot" class="results">
    <p v-if="scopedIssues.length > 0" class="results-count">
      {{ t('reports.count', { filtered: filtered.length, total: scopedIssues.length }) }}
    </p>

    <GlassPanel v-if="scopedIssues.length === 0" padding="lg" tone="fill" class="empty">
      <p class="empty-title">
        {{ t(isStaffQueue ? 'reports.emptyStaffTitle' : 'reports.emptyCitizenTitle') }}
      </p>
      <p class="hint">
        {{ t(isStaffQueue ? 'reports.emptyStaffHint' : 'reports.emptyCitizenHint') }}
      </p>
      <button v-if="!isStaffQueue" type="button" class="btn" @click="router.push('/report')">
        {{ t('reports.newReport') }}
      </button>
    </GlassPanel>

    <GlassPanel v-else-if="filtered.length === 0" padding="lg" tone="fill" class="empty">
      <p class="empty-title">{{ t('reports.noMatches') }}</p>
      <p class="hint">{{ t('reports.noMatchesHint') }}</p>
    </GlassPanel>

    <div v-if="filtered.length > 0 && !isStaffQueue" class="list">
      <IssueCard
        v-for="issue in filtered"
        :key="issue.id"
        :issue="issue"
        :highlighted="highlightIssueId === issue.id"
        @select="emit('openIssue', $event)"
      />
    </div>

    <div v-if="filtered.length > 0 && isStaffQueue" class="staff-results">
      <div class="list cards">
        <IssueCard
          v-for="issue in filtered"
          :key="issue.id"
          :issue="issue"
          :highlighted="highlightIssueId === issue.id"
          @select="emit('openIssue', $event)"
        />
      </div>

      <GlassPanel padding="md" tone="fill" class="ledger">
        <table :aria-label="t('reports.tableLabel')">
          <thead>
            <tr>
              <th>{{ t('reports.colId') }}</th>
              <th>{{ t('reports.colFiled') }}</th>
              <th>{{ t('reports.colType') }}</th>
              <th>{{ t('reports.colSeverity') }}</th>
              <th>{{ t('reports.colLocation') }}</th>
              <th>{{ t('reports.colStatus') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="issue in filtered"
              :key="issue.id"
              data-flip-item
              :class="[`severity-${issue.severity}`, { highlighted: highlightIssueId === issue.id }]"
              @click="emit('openIssue', issue.id)"
            >
              <td class="id">{{ issue.trackingId }}</td>
              <td>{{ formatFiled(issue.createdAt) }}</td>
              <td>{{ t(`category.${issue.category}`) }}</td>
              <td><SeverityPill :severity="issue.severity" /></td>
              <td>{{ issue.locationLabel }}</td>
              <td><StatusPill :status="issue.status" /></td>
            </tr>
          </tbody>
        </table>
      </GlassPanel>
    </div>
    </div>
  </section>
</template>

<style scoped>
.reports {
  display: grid;
  gap: 0.8rem;
}

.track-panel {
  display: grid;
}

.track-form {
  display: grid;
  gap: 0.7rem;
}

.track-copy {
  display: grid;
  gap: 0.2rem;
}

.track-controls {
  display: grid;
  gap: 0.5rem;
}

.track-field {
  min-width: 0;
}

.track-error {
  margin: 0;
  color: var(--danger);
  font-size: 0.82rem;
}

.toolbar {
  display: grid;
  gap: 0.7rem;
}

.sr-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.search,
.select-wrap {
  position: relative;
  display: block;
}

.chips {
  position: relative;
  display: flex;
  gap: 0.2rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0.2rem;
  border-radius: var(--radius-pill);
  background: #f1f0f0;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  min-height: 2.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
}

.chip.active {
  color: var(--accent-ink);
  background: transparent;
}

.results {
  display: grid;
  gap: 0.8rem;
}

.list {
  display: grid;
  gap: 0.65rem;
}

.ledger {
  display: none;
  overflow: auto;
}

.ledger table {
  width: 100%;
  border-collapse: collapse;
}

.ledger th,
.ledger td {
  padding: 0.7rem 0.65rem;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--border);
  font-size: 0.86rem;
}

.ledger th {
  font-size: 0.72rem;
  font-weight: 650;
  color: var(--text-muted);
}

.ledger tbody tr {
  cursor: pointer;
  box-shadow: inset 3px 0 0 var(--severity-medium-mark);
}

.ledger tbody tr.severity-high {
  box-shadow: inset 3px 0 0 var(--severity-high-mark);
}

.ledger tbody tr.severity-low {
  box-shadow: inset 3px 0 0 var(--severity-low-mark);
}

.ledger tbody tr:hover {
  background: var(--surface-raised);
}

.ledger tr.highlighted {
  background: var(--surface-raised);
}

.ledger .id {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-h);
  white-space: nowrap;
}

.results-count {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--text-muted);
}

.empty {
  display: grid;
  gap: 0.5rem;
  justify-items: start;
}

.empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-h);
}

@media (min-width: 720px) {
  .track-controls {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .track-controls .btn {
    min-width: 8.5rem;
  }

  .toolbar {
    grid-template-columns: minmax(0, 1.3fr) auto;
    align-items: center;
  }

  .chips {
    grid-column: 1 / -1;
  }

  .select-wrap {
    min-width: 12rem;
  }

  .list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cards {
    display: none;
  }

  .ledger {
    display: block;
  }
}

@media (min-width: 1024px) {
  .toolbar {
    grid-template-columns: minmax(14rem, 1fr) minmax(0, 1.6fr) 13rem;
    align-items: center;
  }

  .chips {
    grid-column: auto;
  }
}
</style>
