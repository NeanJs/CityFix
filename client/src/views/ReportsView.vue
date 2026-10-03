<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { issueCategories } from '../data/categories'
import { useIssues } from '../composables/useIssues'
import type { IssueCategory, IssueStatus } from '../types/issue'
import IssueCard from '../components/IssueCard.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const route = useRoute()

const highlightIssueId = computed(() => {
  const value = route.query.highlight
  return typeof value === 'string' ? value : null
})

const emit = defineEmits<{
  openIssue: [id: string]
}>()

const { issues } = useIssues()

const statusFilter = ref<'all' | IssueStatus>('all')
const categoryFilter = ref<'all' | IssueCategory>('all')
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return issues.value.filter((issue) => {
    if (statusFilter.value !== 'all' && issue.status !== statusFilter.value) {
      return false
    }
    if (categoryFilter.value !== 'all' && issue.category !== categoryFilter.value) {
      return false
    }
    if (!q) {
      return true
    }
    const haystack = `${issue.title} ${issue.description} ${issue.locationLabel}`.toLowerCase()
    return haystack.includes(q)
  })
})

const statusFilters: { id: 'all' | IssueStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'in_review', label: 'In review' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'resolved', label: 'Resolved' },
]
</script>

<template>
  <section class="reports">
    <AppHeader subtitle="Track every report in one place" />

    <GlassPanel padding="md" class="filters">
      <label class="search">
        <span class="sr-only">Search reports</span>
        <input v-model="query" type="search" placeholder="Search title, location…" />
      </label>

      <div class="chips" role="tablist" aria-label="Filter by status">
        <button
          v-for="item in statusFilters"
          :key="item.id"
          type="button"
          class="chip"
          :class="{ active: statusFilter === item.id }"
          @click="statusFilter = item.id"
        >
          {{ item.label }}
        </button>
      </div>

      <label class="select-wrap">
        <span class="select-label">Category</span>
        <select v-model="categoryFilter">
          <option value="all">All categories</option>
          <option v-for="cat in issueCategories" :key="cat.id" :value="cat.id">
            {{ cat.label }}
          </option>
        </select>
      </label>
    </GlassPanel>

    <p v-if="filtered.length === 0" class="empty">No reports match your filters.</p>

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
  gap: 0.85rem;
}

.filters {
  display: grid;
  gap: 0.75rem;
}

.search input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-h);
  font-size: 0.92rem;
}

.search input::placeholder {
  color: var(--text-muted);
}

.chips {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.chip.active {
  color: var(--text-h);
  border-color: rgba(45, 212, 191, 0.45);
  background: rgba(45, 212, 191, 0.14);
}

.select-wrap {
  display: grid;
  gap: 0.35rem;
}

.select-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-h);
  font-size: 0.9rem;
}

.list {
  display: grid;
  gap: 0.65rem;
}

.empty {
  margin: 0.5rem 0 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
