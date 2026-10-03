<script setup lang="ts">
import { computed } from 'vue'
import heroImage from '../assets/hero.png'
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

    <GlassPanel padding="lg" class="hero">
      <div class="hero-copy">
        <p class="eyebrow">{{ t('home.eyebrow') }}</p>
        <h2 class="headline">{{ t('home.headline') }}</h2>
        <p class="lede">{{ t('home.lede') }}</p>
        <button type="button" class="btn" @click="router.push('/report')">
          {{ t('home.newReport') }}
        </button>
        <ol class="marks">
          <li>{{ t('home.stepPhoto') }}</li>
          <li>{{ t('home.stepVoice') }}</li>
          <li>{{ t('home.stepTrack') }}</li>
        </ol>
      </div>
      <div class="hero-visual">
        <img :src="heroImage" alt="" width="320" height="200" decoding="async" />
      </div>
    </GlassPanel>

    <div class="section-head">
      <h2 class="section-title">{{ t('home.recent') }}</h2>
      <button type="button" class="link" @click="router.push('/reports')">{{ t('home.viewAll') }}</button>
    </div>

    <GlassPanel v-if="recentIssues.length === 0" padding="lg" tone="paper" class="empty">
      <p class="empty-title">{{ t('home.emptyTitle') }}</p>
      <p class="hint">{{ t('home.emptyHint') }}</p>
      <button type="button" class="btn" @click="router.push('/report')">{{ t('home.fileReport') }}</button>
    </GlassPanel>

    <div v-else class="list">
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
  gap: 0.9rem;
}

.hero {
  display: grid;
  gap: 1rem;
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
  max-width: 42ch;
}

.marks {
  margin: 0.35rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.marks li {
  padding: 0.28rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-h);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-visual {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
}

.hero-visual img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
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

@media (min-width: 720px) {
  .hero {
    grid-template-columns: 1.05fr 0.95fr;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
