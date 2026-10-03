<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useIssues } from '../../composables/useIssues'
import { useLocale } from '../../composables/useLocale'
import IssueCard from '../../components/IssueCard.vue'
import AppHeader from '../../components/layout/AppHeader.vue'
import GlassPanel from '../../components/ui/GlassPanel.vue'

const { issues, openCount, resolvedCount } = useIssues()
const { t } = useLocale()
const router = useRouter()

const emit = defineEmits<{
  openIssue: [id: string]
}>()
</script>

<template>
  <section class="home">
    <AppHeader :subtitle="t('adminHome.title')" show-account />

    <GlassPanel padding="lg" class="hero">
      <div class="hero-copy">
        <p class="eyebrow">{{ t('adminHome.eyebrow') }}</p>
        <h2 class="headline">{{ t('adminHome.headline') }}</h2>
        <p class="lede">{{ t('adminHome.lede') }}</p>
        <button type="button" class="btn" @click="router.push('/admin/reports')">
          {{ t('adminHome.viewAll') }}
        </button>
      </div>
    </GlassPanel>

    <div class="stats">
      <GlassPanel padding="md" tone="paper" class="stat">
        <p class="stat-value">{{ openCount }}</p>
        <p class="stat-label">{{ t('adminHome.open') }}</p>
      </GlassPanel>
      <GlassPanel padding="md" tone="paper" class="stat">
        <p class="stat-value">{{ resolvedCount }}</p>
        <p class="stat-label">{{ t('adminHome.resolved') }}</p>
      </GlassPanel>
      <GlassPanel padding="md" tone="paper" class="stat">
        <p class="stat-value">{{ issues.length }}</p>
        <p class="stat-label">{{ t('adminHome.onRecord') }}</p>
      </GlassPanel>
    </div>

    <div class="section-head">
      <h2 class="section-title">{{ t('adminHome.recent') }}</h2>
      <button type="button" class="link" @click="router.push('/admin/reports')">
        {{ t('adminHome.viewAll') }}
      </button>
    </div>

    <GlassPanel v-if="issues.length === 0" padding="lg" tone="paper" class="empty">
      <p class="empty-title">{{ t('adminHome.emptyTitle') }}</p>
      <p class="hint">{{ t('adminHome.emptyHint') }}</p>
    </GlassPanel>

    <div v-else class="list">
      <IssueCard
        v-for="issue in issues.slice(0, 6)"
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

.hero-copy {
  display: grid;
  gap: 0.55rem;
  justify-items: start;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.headline {
  margin: 0;
  font-size: clamp(1.45rem, 4.6vw, 2rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.lede {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--text-muted);
  max-width: 52ch;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.stat {
  display: grid;
  gap: 0.15rem;
}

.stat-value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 750;
  color: var(--text-h);
  letter-spacing: -0.03em;
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.2rem;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-h);
  font-family: var(--font-display);
}

.link {
  border: none;
  background: none;
  padding: 0.25rem 0;
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--accent);
  cursor: pointer;
}

.empty {
  display: grid;
  gap: 0.55rem;
  justify-items: start;
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

@media (min-width: 1024px) {
  .home {
    grid-template-columns: minmax(0, 1.35fr) minmax(14rem, 0.65fr);
    align-items: start;
  }

  .home > :not(.hero):not(.stats) {
    grid-column: 1 / -1;
  }

  .hero {
    grid-column: 1;
    min-height: 100%;
  }

  .stats {
    grid-column: 2;
    grid-template-columns: 1fr;
    align-self: stretch;
  }

  .stat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 5.25rem;
  }

  .list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1400px) {
  .home {
    grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 0.55fr);
  }
}
</style>
