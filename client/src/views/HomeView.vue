<script setup lang="ts">
import heroImage from '../assets/hero.png'
import { appName, appTagline } from '../config/appConfig'
import { useRouter } from 'vue-router'
import { useIssues } from '../composables/useIssues'
import IssueCard from '../components/IssueCard.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const { issues, openCount, resolvedCount } = useIssues()
const router = useRouter()

const recentIssues = issues

const emit = defineEmits<{
  openIssue: [id: string]
}>()
</script>

<template>
  <section class="home">
    <AppHeader :subtitle="appTagline" />

    <GlassPanel padding="lg" class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Civic operations</p>
        <h1 class="headline">
          Make {{ appName }} work for your neighborhood
        </h1>
        <p class="lede">
          Snap a problem, pin the location, and follow progress from submission to resolution.
        </p>
        <button type="button" class="cta" @click="router.push('/report')">
          Report an issue
        </button>
      </div>
      <div class="hero-visual">
        <img :src="heroImage" alt="" width="320" height="200" decoding="async" />
      </div>
    </GlassPanel>

    <div class="stats">
      <GlassPanel padding="md" class="stat">
        <p class="stat-value">{{ openCount }}</p>
        <p class="stat-label">Open reports</p>
      </GlassPanel>
      <GlassPanel padding="md" class="stat">
        <p class="stat-value">{{ resolvedCount }}</p>
        <p class="stat-label">Resolved</p>
      </GlassPanel>
      <GlassPanel padding="md" class="stat">
        <p class="stat-value">{{ issues.length }}</p>
        <p class="stat-label">Total tracked</p>
      </GlassPanel>
    </div>

    <div class="section-head">
      <h2 class="section-title">Recent activity</h2>
      <button type="button" class="link" @click="router.push('/reports')">View all</button>
    </div>

    <div class="list">
      <IssueCard
        v-for="issue in recentIssues.slice(0, 3)"
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
  gap: 1rem;
}

.hero {
  display: grid;
  gap: 1rem;
}

.hero-copy {
  display: grid;
  gap: 0.65rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.headline {
  margin: 0;
  font-size: clamp(1.35rem, 4.5vw, 1.75rem);
  line-height: 1.2;
  font-weight: 750;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.lede {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--text-muted);
  max-width: 36ch;
}

.cta {
  margin-top: 0.35rem;
  width: fit-content;
  padding: 0.7rem 1.15rem;
  border: none;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 650;
  color: #042f2e;
  cursor: pointer;
  background: linear-gradient(135deg, #5eead4, #38bdf8);
  box-shadow:
    0 10px 24px rgba(14, 165, 233, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.cta:active {
  transform: scale(0.98);
}

.hero-visual {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.04);
}

.hero-visual img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.stat-value {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 750;
  color: var(--text-h);
  letter-spacing: -0.03em;
}

.stat-label {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-h);
}

.link {
  border: none;
  background: none;
  padding: 0.25rem 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
}

.list {
  display: grid;
  gap: 0.65rem;
}

@media (min-width: 720px) {
  .hero {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .home {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    align-items: start;
  }

  .home > :not(.hero):not(.stats) {
    grid-column: 1 / -1;
  }

  .hero {
    grid-column: 1;
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
  }
}
</style>
