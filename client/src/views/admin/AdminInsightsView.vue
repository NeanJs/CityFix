<script setup lang="ts">
import type { ChartData } from 'chart.js'
import { computed, ref } from 'vue'
import InsightsChart from '../../components/insights/InsightsChart.vue'
import AppHeader from '../../components/layout/AppHeader.vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import GlassPanel from '../../components/ui/GlassPanel.vue'
import SelectionIndicator from '../../components/ui/SelectionIndicator.vue'
import SkeletonPanel from '../../components/ui/SkeletonPanel.vue'
import { useIssues } from '../../composables/useIssues'
import { useLocale } from '../../composables/useLocale'
import { useSkeletonHold } from '../../composables/useSkeletonHold'
import {
  calculateInsights,
  type InsightAlert,
  type InsightsRange,
} from '../../services/insights/calculateInsights'

const emit = defineEmits<{
  openIssue: [id: string]
}>()

const { issues, staffLoadStatus, loadStaffReports } = useIssues()
const { t, issueTypeLabel } = useLocale()
const range = ref<InsightsRange>('30d')
const refreshing = ref(false)
const staffSettled = computed(
  () => staffLoadStatus.value === 'ready' || staffLoadStatus.value === 'error',
)
const showSkeleton = useSkeletonHold(staffSettled)

const insights = computed(() => calculateInsights(issues.value, range.value))

const ranges: { id: InsightsRange; labelKey: string }[] = [
  { id: '7d', labelKey: 'adminInsights.range7d' },
  { id: '30d', labelKey: 'adminInsights.range30d' },
  { id: 'all', labelKey: 'adminInsights.rangeAll' },
]

function cssColor(name: string, fallback: string) {
  if (typeof window === 'undefined') {
    return fallback
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function formatDuration(hours: number | null) {
  if (hours === null) {
    return t('adminInsights.notAvailable')
  }
  if (hours < 24) {
    return t('adminInsights.hours', { count: Math.max(1, Math.round(hours)) })
  }
  return t('adminInsights.days', { count: Math.round(hours / 24) })
}

const kpis = computed(() => [
  {
    label: t('adminInsights.resolutionRate'),
    value: `${insights.value.resolutionRate}%`,
    detail: t('adminInsights.resolutionRateDetail', { count: insights.value.total }),
    tone: 'positive',
  },
  {
    label: t('adminInsights.avgTurnaround'),
    value: formatDuration(insights.value.averageResolutionHours),
    detail: t('adminInsights.avgTurnaroundDetail'),
    tone: 'neutral',
  },
  {
    label: t('adminInsights.backlog'),
    value: String(insights.value.backlog),
    detail: t('adminInsights.backlogDetail', {
      filed: insights.value.sevenDayFiled,
      resolved: insights.value.sevenDayResolved,
    }),
    tone: insights.value.velocityRatio !== null && insights.value.velocityRatio < 1 ? 'warning' : 'positive',
  },
  {
    label: t('adminInsights.highAttention'),
    value: `${insights.value.attentionRate}%`,
    detail: t('adminInsights.highAttentionDetail', { count: insights.value.highSeverityOpen }),
    tone: insights.value.highSeverityOpen ? 'warning' : 'positive',
  },
])

const trendData = computed<ChartData>(() => ({
  labels: insights.value.trend.map((point) => shortDate(point.date)),
  datasets: [
    {
      label: t('adminInsights.filed'),
      data: insights.value.trend.map((point) => point.filed),
      borderColor: cssColor('--accent', '#7d5e30'),
      backgroundColor: 'rgba(125, 94, 48, 0.14)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
    },
    {
      label: t('adminInsights.resolved'),
      data: insights.value.trend.map((point) => point.resolved),
      borderColor: cssColor('--severity-low-mark', '#3d6a48'),
      backgroundColor: 'rgba(61, 106, 72, 0.08)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
    },
  ],
}))

const categoryData = computed<ChartData>(() => ({
  labels: insights.value.categories.slice(0, 6).map((item) => issueTypeLabel(item.issueType)),
  datasets: [
    {
      label: t('adminInsights.open'),
      data: insights.value.categories.slice(0, 6).map((item) => item.open),
      backgroundColor: cssColor('--accent', '#7d5e30'),
      borderRadius: 7,
    },
    {
      label: t('adminInsights.resolved'),
      data: insights.value.categories
        .slice(0, 6)
        .map((item) => item.resolved),
      backgroundColor: cssColor('--severity-low-mark', '#3d6a48'),
      borderRadius: 7,
    },
  ],
}))

const severityData = computed<ChartData>(() => ({
  labels: insights.value.severities.map((item) => t(`severity.${item.severity}`)),
  datasets: [
    {
      label: t('adminInsights.open'),
      data: insights.value.severities.map((item) => item.open),
      backgroundColor: [
        cssColor('--severity-high-mark', '#9a3a30'),
        cssColor('--severity-medium-mark', '#b48428'),
        cssColor('--severity-low-mark', '#3d6a48'),
      ],
      borderWidth: 0,
      hoverOffset: 7,
    },
  ],
}))

function alertTitle(alert: InsightAlert) {
  return t(`adminInsights.alerts.${alert.kind}Title`)
}

function alertBody(alert: InsightAlert) {
  return t(`adminInsights.alerts.${alert.kind}Body`, {
    count: alert.count,
    location: alert.location ?? '',
    issueType: alert.issueType ? issueTypeLabel(alert.issueType) : '',
  })
}

function openFirst(issueIds: string[]) {
  const id = issueIds[0]
  if (id) {
    emit('openIssue', id)
  }
}

async function refresh() {
  if (refreshing.value) {
    return
  }
  refreshing.value = true
  try {
    await loadStaffReports()
  } finally {
    refreshing.value = false
  }
}
</script>

<template>
  <section class="insights">
    <div class="header-row">
      <AppHeader :subtitle="t('adminInsights.title')" show-account compact />
      <button type="button" class="btn-ghost refresh" :disabled="refreshing" @click="refresh">
        <AppIcon name="arrowsClockwise" size="1rem" />
        <span class="refresh-label">
          {{ refreshing ? t('adminInsights.refreshing') : t('adminInsights.refresh') }}
        </span>
      </button>
    </div>

    <div class="range-row">
      <p class="lede">{{ t('adminInsights.lede') }}</p>
      <div class="range surface-frost" :aria-label="t('adminInsights.rangeLabel')">
        <SelectionIndicator :active-key="range" />
        <button
          v-for="item in ranges"
          :key="item.id"
          type="button"
          class="range-button"
          :class="{ active: range === item.id }"
          :data-selection-active="range === item.id ? 'true' : undefined"
          @click="range = item.id"
        >
          {{ t(item.labelKey) }}
        </button>
      </div>
    </div>

    <template v-if="showSkeleton">
      <p class="sr-only" aria-live="polite">{{ t('adminInsights.loading') }}</p>
      <div class="kpis">
        <SkeletonPanel v-for="index in 4" :key="index" :lines="2" />
      </div>
      <div class="analytics">
        <SkeletonPanel class="trend" tall :lines="2" />
        <SkeletonPanel tall :lines="2" />
      </div>
    </template>
    <GlassPanel v-else-if="staffLoadStatus === 'error' && !issues.length" padding="lg" class="state">
      <p class="state-title">{{ t('adminInsights.loadFailed') }}</p>
      <button type="button" class="btn" @click="refresh">{{ t('adminInsights.retry') }}</button>
    </GlassPanel>
    <GlassPanel v-else-if="!issues.length" padding="lg" class="state">
      <p class="state-title">{{ t('adminInsights.emptyTitle') }}</p>
      <p class="status">{{ t('adminInsights.emptyBody') }}</p>
    </GlassPanel>

    <template v-else>
      <div class="kpis">
        <GlassPanel
          v-for="kpi in kpis"
          :key="kpi.label"
          padding="lg"
          tone="fill"
          class="kpi"
          :class="kpi.tone"
        >
          <span class="kpi-label">{{ kpi.label }}</span>
          <strong class="kpi-value">{{ kpi.value }}</strong>
          <span class="kpi-detail">{{ kpi.detail }}</span>
        </GlassPanel>
      </div>

      <section class="section">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ t('adminInsights.priorityEyebrow') }}</p>
            <h2>{{ t('adminInsights.priorityTitle') }}</h2>
          </div>
          <span class="count">{{ insights.alerts.length }}</span>
        </div>

        <div v-if="insights.alerts.length" class="alerts">
          <GlassPanel
            v-for="alert in insights.alerts"
            :key="alert.kind"
            padding="lg"
            tone="fill"
            class="alert"
            :class="alert.kind"
          >
            <div>
              <p class="alert-title">{{ alertTitle(alert) }}</p>
              <p class="alert-body">{{ alertBody(alert) }}</p>
            </div>
            <button type="button" class="btn-ghost" @click="openFirst(alert.issueIds)">
              {{ t('adminInsights.reviewFirst') }}
            </button>
          </GlassPanel>
        </div>
        <GlassPanel v-else padding="lg" tone="fill" class="clear-state">
          <AppIcon name="checkCircle" size="1.5rem" />
          <div>
            <p class="alert-title">{{ t('adminInsights.clearTitle') }}</p>
            <p class="alert-body">{{ t('adminInsights.clearBody') }}</p>
          </div>
        </GlassPanel>
      </section>

      <div class="analytics">
        <GlassPanel padding="lg" tone="fill" class="chart-panel trend">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ t('adminInsights.flowEyebrow') }}</p>
              <h2>{{ t('adminInsights.flowTitle') }}</h2>
            </div>
            <span
              class="velocity"
              :class="{ behind: insights.velocityRatio !== null && insights.velocityRatio < 1 }"
            >
              {{
                insights.velocityRatio === null
                  ? t('adminInsights.noIntake')
                  : t('adminInsights.velocity', {
                      value: Math.round(insights.velocityRatio * 100),
                    })
              }}
            </span>
          </div>
          <InsightsChart
            type="line"
            :data="trendData"
            :accessible-label="t('adminInsights.flowChartLabel')"
          />
        </GlassPanel>

        <GlassPanel padding="lg" tone="fill" class="chart-panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ t('adminInsights.demandEyebrow') }}</p>
              <h2>{{ t('adminInsights.demandTitle') }}</h2>
            </div>
          </div>
          <InsightsChart
            type="bar"
            :data="categoryData"
            :accessible-label="t('adminInsights.categoryChartLabel')"
          />
        </GlassPanel>

        <GlassPanel padding="lg" tone="fill" class="chart-panel severity-panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">{{ t('adminInsights.riskEyebrow') }}</p>
              <h2>{{ t('adminInsights.riskTitle') }}</h2>
            </div>
          </div>
          <InsightsChart
            type="doughnut"
            :data="severityData"
            :accessible-label="t('adminInsights.severityChartLabel')"
          />
        </GlassPanel>

        <GlassPanel padding="none" tone="fill" class="hotspots">
          <div class="hotspot-head">
            <p class="eyebrow">{{ t('adminInsights.hotspotEyebrow') }}</p>
            <h2>{{ t('adminInsights.hotspotTitle') }}</h2>
          </div>
          <div v-if="insights.hotspots.length" class="hotspot-list">
            <button
              v-for="(hotspot, index) in insights.hotspots"
              :key="hotspot.location"
              type="button"
              class="hotspot"
              @click="openFirst(hotspot.issueIds)"
            >
              <span class="hotspot-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="hotspot-name">{{ hotspot.location }}</span>
              <span class="hotspot-meta">
                {{ t('adminInsights.hotspotMeta', { open: hotspot.open, total: hotspot.total }) }}
              </span>
            </button>
          </div>
          <p v-else class="status hotspot-empty">{{ t('adminInsights.noHotspots') }}</p>
        </GlassPanel>
      </div>
    </template>
  </section>
</template>

<style scoped>
.insights {
  display: grid;
  gap: 1.25rem;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.header-row :deep(.header) {
  flex: 1;
}

.refresh {
  flex-shrink: 0;
}

.range-row {
  display: grid;
  gap: 0.75rem;
}

.lede,
.status {
  margin: 0;
  color: var(--text-muted);
}

.lede {
  max-width: 50rem;
  font-size: 1.02rem;
}

.range {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
}

.range-button {
  position: relative;
  z-index: 1;
  min-height: 2.45rem;
  padding: 0.35rem 0.7rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--selection-inactive-fg);
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.range-button.active {
  color: var(--selection-active-fg);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.kpis :deep(.skeleton-panel) {
  min-height: 8.5rem;
}

.kpi {
  position: relative;
  display: grid;
  align-content: start;
  gap: 0.25rem;
  min-height: 8.5rem;
  box-shadow: inset 0 3px 0 var(--accent);
}

.kpi.positive {
  box-shadow: inset 0 3px 0 var(--severity-low-mark);
}

.kpi.warning {
  box-shadow: inset 0 3px 0 var(--severity-high-mark);
}

.kpi-label,
.kpi-detail {
  color: var(--text-muted);
}

.kpi-label {
  font-size: 0.83rem;
  font-weight: 650;
}

.kpi-value {
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 6vw, 2.7rem);
  line-height: 1.05;
  letter-spacing: -0.035em;
  color: var(--text-h);
  font-variant-numeric: tabular-nums;
}

.kpi-detail {
  margin-top: auto;
  font-size: 0.76rem;
  line-height: 1.3;
}

.section,
.analytics {
  display: grid;
  gap: 0.75rem;
}

.section-head,
.panel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

h2,
.eyebrow,
.alert-title,
.alert-body {
  margin: 0;
}

h2 {
  color: var(--text-h);
  font-size: 1.15rem;
  line-height: 1.2;
}

.eyebrow {
  margin-bottom: 0.15rem;
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.count,
.velocity {
  flex-shrink: 0;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.velocity.behind {
  border-color: var(--severity-high-bd);
  background: var(--severity-high-bg);
  color: var(--severity-high-fg);
}

.alerts {
  display: grid;
  gap: 0.6rem;
}

.alert {
  display: grid;
  gap: 0.85rem;
  border-left: 4px solid var(--accent);
}

.alert:only-child {
  grid-column: 1 / -1;
}

.alert.critical,
.alert.stalled {
  border-left-color: var(--severity-high-mark);
}

.alert-title {
  color: var(--text-h);
  font-weight: 750;
}

.alert-body {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.clear-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--severity-low-mark);
}

.chart-panel {
  min-width: 0;
}

.severity-panel :deep(.chart) {
  min-height: 14rem;
}

.panel-head,
.hotspot-head {
  margin-bottom: 0.75rem;
}

.hotspot-head {
  padding: 1.15rem 1.2rem 0;
}

.hotspot-list {
  display: grid;
}

.hotspot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.1rem 0.7rem;
  width: 100%;
  padding: 0.85rem 1.2rem;
  border: 0;
  border-top: 1px solid var(--border);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.hotspot-rank {
  grid-row: span 2;
  align-self: center;
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.hotspot-name {
  overflow: hidden;
  color: var(--text-h);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hotspot-meta {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.hotspot-empty {
  padding: 0 1.2rem 1.2rem;
}

.state {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
}

.state-title {
  margin: 0;
  color: var(--text-h);
  font-weight: 750;
}

@media (min-width: 720px) {
  .range-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .range {
    min-width: 18rem;
  }

  .kpis {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .alerts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .alert {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .analytics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trend {
    grid-column: 1 / -1;
  }

  .severity-panel :deep(.chart) {
    min-height: 16rem;
  }
}

@media (min-width: 1200px) {
  .analytics {
    grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.6fr);
  }

  .trend {
    grid-column: auto;
  }

  .severity-panel {
    min-height: 24rem;
  }

  .severity-panel :deep(.chart) {
    min-height: 18rem;
  }
}

@media (max-width: 480px) {
  .refresh {
    width: 2.65rem;
    min-width: 2.65rem;
    padding-inline: 0;
  }

  .refresh-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
