<script setup lang="ts">
import { computed, ref } from 'vue'
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

const quickTrackingId = ref('')

const reporterIssues = computed(() => issuesForReporter(reporterId.value))

const openCount = computed(
  () => reporterIssues.value.filter((issue) => isOpenStatus(issue.status)).length,
)

const resolvedCount = computed(
  () => reporterIssues.value.filter((issue) => issue.status === 'resolved').length,
)

const recentIssues = computed(() => reporterIssues.value.slice(0, 4))

const emit = defineEmits<{
  openIssue: [id: string]
}>()

function onTrackSubmit() {
  const code = quickTrackingId.value.trim()
  if (!code) {
    return
  }
  router.push({ path: '/reports', query: { track: code } })
}
</script>

<template>
  <section class="home">
    <AppHeader :subtitle="t('home.title')" show-account />

    <div class="overview-grid">
      <!-- Quick Action / Filing Banner -->
      <GlassPanel padding="lg" tone="fill" class="action-card">
        <div class="action-card-header">
          <p class="section-kicker">{{ t('home.tagline') }}</p>
          <h2 class="action-title">{{ t('report.heading') }}</h2>
          <p class="hint">{{ t('report.lead') }}</p>
        </div>

        <div class="action-buttons">
          <button type="button" class="btn report-cta" @click="router.push('/report')">
            <AppIcon name="plus" size="1.05rem" />
            {{ t('home.reportProblem') }}
          </button>
          <button type="button" class="btn-secondary" @click="router.push('/voice')">
            <AppIcon name="voice" size="1.05rem" />
            {{ t('home.speakToDesk') }}
          </button>
        </div>
      </GlassPanel>

      <!-- Status & Metrics Card -->
      <GlassPanel padding="lg" tone="fill" class="metrics-card">
        <div class="metrics-grid">
          <button
            type="button"
            class="metric-box clickable"
            @click="router.push('/reports')"
          >
            <span class="metric-value">{{ openCount }}</span>
            <span class="metric-label">{{ t('home.openReports') }}</span>
          </button>

          <button
            type="button"
            class="metric-box clickable"
            @click="router.push('/reports')"
          >
            <span class="metric-value">{{ resolvedCount }}</span>
            <span class="metric-label">{{ t('home.resolvedReports') }}</span>
          </button>

          <button
            type="button"
            class="metric-box clickable"
            @click="router.push('/reports')"
          >
            <span class="metric-value">{{ reporterIssues.length }}</span>
            <span class="metric-label">{{ t('home.totalReports') }}</span>
          </button>
        </div>

        <form class="track-form" @submit.prevent="onTrackSubmit">
          <label class="sr-label" for="home-track-input">{{ t('reports.trackLabel') }}</label>
          <div class="track-input-wrap">
            <AppIcon class="track-icon" name="magnifyingGlass" size="1rem" />
            <input
              id="home-track-input"
              v-model="quickTrackingId"
              class="control track-input"
              type="text"
              maxlength="40"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('reports.trackPlaceholder')"
            />
            <button
              type="submit"
              class="btn track-btn"
              :disabled="!quickTrackingId.trim()"
            >
              {{ t('reports.trackSubmit') }}
            </button>
          </div>
        </form>
      </GlassPanel>
    </div>

    <!-- Recent Reports Section -->
    <div class="recent">
      <div class="section-head">
        <h2 class="section-title">{{ t('home.recentReports') }}</h2>
        <button
          v-if="reporterIssues.length > 0"
          type="button"
          class="btn-ghost"
          @click="router.push('/reports')"
        >
          {{ t('home.viewAll') }}
        </button>
      </div>

      <GlassPanel v-if="reporterIssues.length === 0" padding="lg" tone="fill" class="empty">
        <AppIcon class="empty-icon" name="tray" size="1.75rem" />
        <p class="empty-title">{{ t('home.emptyTitle') }}</p>
        <p class="hint">{{ t('home.emptyHint') }}</p>
        <button type="button" class="btn" @click="router.push('/report')">
          <AppIcon name="plus" size="1rem" />
          {{ t('home.reportProblem') }}
        </button>
      </GlassPanel>

      <div v-else class="list">
        <IssueCard
          v-for="issue in recentIssues"
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

.overview-grid {
  display: grid;
  gap: 1rem;
}

.action-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: min(48%, 14rem);
  height: 42%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.85;
  background: radial-gradient(
    ellipse 100% 100% at 100% 0%,
    rgba(125, 94, 48, 0.045),
    transparent 72%
  );
  mask-image: linear-gradient(to bottom, black 0%, transparent 92%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 92%);
}

.action-card-header,
.action-buttons {
  position: relative;
  z-index: 1;
}

.action-card-header {
  display: grid;
  gap: 0.35rem;
}

.action-title {
  margin: 0;
  font-size: clamp(1.35rem, 3.2vw, 1.85rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.metrics-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.metric-box {
  display: grid;
  gap: 0.15rem;
  justify-items: start;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised-solid);
  text-align: left;
  color: inherit;
  font: inherit;
}

.metric-box.clickable {
  cursor: pointer;
  transition:
    background-color var(--motion-duration-xs) var(--motion-ease),
    transform var(--motion-duration-press) var(--motion-ease);
}

.metric-box.clickable:hover {
  background: #f1f0f0;
}

.metric-box.clickable:active {
  transform: scale(0.98);
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
  line-height: 1.2;
}

.track-form {
  display: block;
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

.track-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.track-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.track-input {
  padding-inline-start: 2.3rem;
  padding-inline-end: 0.5rem;
}

.track-btn {
  flex-shrink: 0;
  min-height: 2.5rem;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
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
  justify-items: start;
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
  gap: 0.85rem;
  min-width: 0;
}

@media (min-width: 720px) {
  .overview-grid {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }

  .list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .home {
    gap: 1.75rem;
  }
}
</style>
