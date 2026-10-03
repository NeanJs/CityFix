<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { issueCategories } from '../data/categories'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import type { IssueCategory, IssueStatus } from '../types/issue'
import IssueCard from '../components/IssueCard.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import SeverityPill from '../components/SeverityPill.vue'
import StatusPill from '../components/StatusPill.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const { currentUser } = useAuth()
const { issues, issuesForReporter } = useIssues()

const highlightIssueId = computed(() => {
  const value = route.query.highlight
  return typeof value === 'string' ? value : null
})

const isStaffQueue = computed(() => route.meta.issueScope === 'all')

const scopedIssues = computed(() => {
  if (isStaffQueue.value) {
    return issues.value
  }
  if (!currentUser.value) {
    return []
  }
  return issuesForReporter(currentUser.value.id)
})

const emit = defineEmits<{
  openIssue: [id: string]
}>()

const statusFilter = ref<'all' | IssueStatus>('all')
const categoryFilter = ref<'all' | IssueCategory>('all')
const query = ref('')

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

    <GlassPanel padding="md" tone="paper" class="toolbar">
      <label class="search">
        <span class="sr-label">{{ t('reports.search') }}</span>
        <input
          v-model="query"
          class="control"
          type="search"
          :placeholder="t('reports.searchPlaceholder')"
        />
      </label>

      <div class="chips" role="tablist" :aria-label="t('reports.filterStatus')">
        <button
          v-for="item in statusFilters"
          :key="item.id"
          type="button"
          class="chip"
          :class="{ active: statusFilter === item.id }"
          @click="statusFilter = item.id"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>

      <label class="select-wrap">
        <span class="sr-label">{{ t('reports.category') }}</span>
        <select v-model="categoryFilter" class="control">
          <option value="all">{{ t('reports.allCategories') }}</option>
          <option v-for="cat in issueCategories" :key="cat.id" :value="cat.id">
            {{ t(`category.${cat.id}`) }}
          </option>
        </select>
      </label>
    </GlassPanel>

    <p v-if="scopedIssues.length > 0" class="results-count">
      {{ t('reports.count', { filtered: filtered.length, total: scopedIssues.length }) }}
    </p>

    <GlassPanel v-if="scopedIssues.length === 0" padding="lg" tone="paper" class="empty">
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

    <GlassPanel v-else-if="filtered.length === 0" padding="lg" tone="paper" class="empty">
      <p class="empty-title">{{ t('reports.noMatches') }}</p>
      <p class="hint">{{ t('reports.noMatchesHint') }}</p>
    </GlassPanel>

    <div v-else class="list">
      <IssueCard
        v-for="issue in filtered"
        :key="issue.id"
        :issue="issue"
        :highlighted="highlightIssueId === issue.id"
        @select="emit('openIssue', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.reports {
  display: grid;
  gap: 0.8rem;
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
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  min-height: 2.15rem;
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-raised);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
}

.chip.active {
  color: var(--text-h);
  border-color: var(--accent);
  background: var(--surface);
}

.list {
  display: grid;
  gap: 0.6rem;
}

.results-count {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

@media (min-width: 1100px) {
  .list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1500px) {
  .list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
