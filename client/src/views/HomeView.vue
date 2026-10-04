<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import { isOpenStatus } from '../services/report/statusFlow'
import IssueCard from '../components/IssueCard.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const { reporterId } = useAuth()
const { issuesForReporter } = useIssues()
const { t } = useLocale()
const router = useRouter()

const recentIssues = computed(() => issuesForReporter(reporterId.value))

const openCount = computed(
  () => recentIssues.value.filter((issue) => isOpenStatus(issue.status)).length,
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
        <AppIcon name="plus" size="1rem" />
        {{ t('home.reportProblem') }}
      </button>
    </div>

    <div class="recent">
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
        <AppIcon class="empty-icon" name="tray" size="1.75rem" />
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
  font-weight: 700;
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
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-h);
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
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-h);
}

.list {
  display: grid;
  gap: 0.65rem;
}

.recent {
  display: grid;
  gap: 1.5rem;
  min-width: 0;
}

@media (min-width: 720px) {
  .home {
    grid-template-columns: minmax(16rem, 0.85fr) minmax(0, 1.15fr);
    align-items: start;
  }

  .home :deep(.header) {
    grid-column: 1 / -1;
  }

  .hero-value {
    font-size: 4rem;
  }
}
</style>
