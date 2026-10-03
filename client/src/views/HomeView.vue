<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import IssueCard from '../components/IssueCard.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const { currentUser } = useAuth()
const { issuesForReporter } = useIssues()
const { t } = useLocale()
const router = useRouter()

const recentIssues = computed(() =>
  currentUser.value ? issuesForReporter(currentUser.value.id) : [],
)

const openCount = computed(
  () => recentIssues.value.filter((issue) => issue.status !== 'resolved').length,
)

const emit = defineEmits<{
  openIssue: [id: string]
}>()
</script>

<template>
  <section class="home">
    <AppHeader :subtitle="t('home.title')" show-account />

    <div class="hero">
      <p class="hero-value">{{ openCount }}</p>
      <p class="hero-label">{{ t('home.openReports') }}</p>
      <button type="button" class="btn report-cta" @click="router.push('/report')">
        {{ t('home.reportProblem') }}
      </button>
    </div>

    <div class="section-head">
      <h2 class="section-title">{{ t('home.openReports') }}</h2>
      <button
        v-if="recentIssues.length > 0"
        type="button"
        class="btn-ghost"
        @click="router.push('/reports')"
      >
        {{ t('home.viewAll') }}
      </button>
    </div>

    <GlassPanel v-if="recentIssues.length === 0" padding="lg" tone="fill" class="empty">
      <p class="empty-title">{{ t('home.emptyTitle') }}</p>
      <p class="hint">{{ t('home.emptyHint') }}</p>
    </GlassPanel>

    <div v-else class="list">
      <IssueCard
        v-for="issue in recentIssues.slice(0, 4)"
        :key="issue.id"
        :issue="issue"
        @select="emit('openIssue', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  gap: 1.5rem;
}

.hero {
  display: grid;
  justify-items: start;
  gap: 0.35rem;
}

.hero-value {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

.hero-label {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-muted);
}

.report-cta {
  min-height: 2.75rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text-h);
}

.empty {
  display: grid;
  gap: 0.4rem;
}

.empty-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text-h);
}

.list {
  display: grid;
  gap: 0.65rem;
}

@media (min-width: 720px) {
  .hero-value {
    font-size: 4rem;
  }
}
</style>
