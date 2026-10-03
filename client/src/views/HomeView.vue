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

const emit = defineEmits<{
  openIssue: [id: string]
}>()
</script>

<template>
  <section class="home">
    <AppHeader :subtitle="t('home.title')" show-account />

    <button type="button" class="btn report-cta" @click="router.push('/report')">
      {{ t('home.reportProblem') }}
    </button>

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

    <GlassPanel v-if="recentIssues.length === 0" padding="lg" tone="paper" class="empty">
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
  gap: 0.9rem;
}

.report-cta {
  width: 100%;
  min-height: 3.4rem;
  font-size: 1.05rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.section-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--text-h);
  font-family: var(--font-display);
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
  gap: 0.6rem;
}

@media (min-width: 720px) {
  .report-cta {
    width: fit-content;
    min-width: 16rem;
  }
}

@media (min-width: 1024px) {
  .list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
