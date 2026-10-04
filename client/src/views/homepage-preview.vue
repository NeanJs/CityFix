<script setup lang="ts">
const problems = [
  {
    title: 'Too many channels, no single pipeline.',
    detail:
      'Calls, emails, social media, and legacy 311 apps fragment information and slow down response times.',
  },
  {
    title: 'Messy, unstructured complaints.',
    detail:
      'Staff spend time re-typing details and guessing location, department, and severity instead of solving the problem.',
  },
  {
    title: 'Little feedback to residents.',
    detail:
      'People rarely know what happened after they report an issue, which erodes trust in local government.',
  },
]

const residentsGet = [
  {
    title: 'Frictionless reporting.',
    detail: 'Snap a photo, speak for a few seconds, confirm the details, and you’re done.',
  },
  {
    title: 'Clear tracking IDs.',
    detail: 'Every report gets a human-friendly tracking code that can be used for follow-up.',
  },
  {
    title: 'Real transparency.',
    detail:
      'Residents can see where their request sits in the pipeline, instead of shouting into a void.',
  },
]

const cityTeamsGet = [
  {
    title: 'A single civic inbox.',
    detail: 'All incoming reports land in one place, standardized and ready to route.',
  },
  {
    title: 'Structured tickets instead of complaints.',
    detail: 'Every request includes type, priority, address, media, and status.',
  },
  {
    title: 'A Kanban view of city issues.',
    detail:
      'Teams drag tickets from “New” to “In Progress” to “Resolved”, making bottlenecks visible.',
  },
  {
    title: 'Better decisions, faster.',
    detail:
      'Clean data on what residents report most—and which departments are under pressure.',
  },
]

const services = [
  {
    title: 'Streets and transportation:',
    detail: 'potholes, road damage, missing signs, unsafe crossings.',
  },
  {
    title: 'Sanitation and waste:',
    detail: 'illegal dumping, overflowing bins, street litter, missed pickups.',
  },
  {
    title: 'Parks and public spaces:',
    detail: 'damaged equipment, unsafe trees, vandalism, cleanliness issues.',
  },
  {
    title: 'Water and utilities:',
    detail: 'leaks, hydrant problems, sewer and drainage concerns.',
  },
]

const aiFeatures = [
  {
    title: 'Voice-to-text transcription',
    detail: 'so residents can speak naturally instead of filling forms.',
  },
  {
    title: 'Automatic classification and prioritization',
    detail: 'to identify the right department and urgency.',
  },
  {
    title: 'Location enrichment',
    detail: 'from text and device hints, helping staff see issues on a map.',
  },
]

const cityGoals = [
  {
    title: 'More sustainable, resilient cities.',
    detail:
      'Faster maintenance and clearer data help you stay ahead of infrastructure issues.',
  },
  {
    title: 'More transparent, trusted institutions.',
    detail:
      'Residents see how their participation leads to visible outcomes, strengthening confidence in local government.',
  },
]

const audiences = [
  {
    title: 'City managers and CIOs',
    detail: 'who want one modern layer between citizens and legacy systems.',
  },
  {
    title: 'Operations and maintenance teams',
    detail: 'that need structured, prioritized requests instead of noisy complaints.',
  },
  {
    title: 'Innovation and digital service units',
    detail: 'looking to pilot AI responsibly in high-impact use cases.',
  },
]

const scenario = [
  'A resident in your city notices a dangerous pothole at a busy intersection.',
  'They open CityFix on their phone, snap a photo, and leave a 10-second voice note.',
  'CityFix transcribes and classifies the issue, sets priority to “High”, suggests the address, and generates a tracking code.',
  'On the city dashboard, your streets team sees a new “High priority – Pothole” card in the “New” column, with the photo and map ready to go.',
  'A staff member drags it to “In Progress”, adds a short note, and later marks it “Resolved”—closing the feedback loop for the resident.',
]

const pilotSteps = [
  'Launch with a single category (for example, streets and roads) in one district.',
  'Use the dashboard to measure volume, time-to-triage, and resolution status.',
  'Expand to more categories and departments once residents and staff are comfortable.',
]
</script>

<template>
  <div id="top" class="homepage-preview">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="CityFix home">CityFix<span> / Civic inbox</span></a>
      <nav aria-label="Page navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#demo">Live demo</a>
        <a class="nav-cta" href="#contact">Request a pilot</a>
      </nav>
    </header>

    <main id="main-content">
      <section class="hero page-width" aria-labelledby="page-title">
        <div class="hero-copy">
          <h1 id="page-title">CityFix – Give Your City a Real-Time Civic Inbox</h1>
          <p class="hero-lede">
            A voice-first way for residents to report issues and for city teams to turn them into
            clean, trackable service tickets in seconds.
          </p>
          <div class="actions">
            <a class="button button-primary" href="#contact">Request a pilot</a>
            <a class="button button-light" href="#demo">See the live demo</a>
          </div>
        </div>

        <div class="inbox-preview" aria-label="A report moving through the CityFix civic inbox">
          <div class="inbox-topline">
            <span>Resident report</span>
            <span class="status-dot">Ready for triage</span>
          </div>
          <h2>Dangerous pothole at a busy intersection</h2>
          <p class="report-meta">Photo + 10-second voice note</p>
          <ol class="status-flow" aria-label="Report status flow">
            <li class="is-current"><span>1</span> New</li>
            <li><span>2</span> In Progress</li>
            <li><span>3</span> Resolved</li>
          </ol>
        </div>
      </section>

      <section class="intro-section page-width" aria-labelledby="built-for">
        <div class="section-heading">
          <p class="section-label">CityFix</p>
          <h2 id="built-for">Built for residents and city teams</h2>
        </div>
        <div class="section-copy">
          <p>
            CityFix connects everyday snapshots and voice notes from residents to the city
            departments that can actually fix the problem—faster, with full transparency.
          </p>
          <ul class="check-list">
            <li>Residents report problems in under 30 seconds from mobile web.</li>
            <li>City teams receive structured, prioritized requests instead of messy complaints.</li>
            <li>Everyone sees how issues move from “reported” to “resolved”.</li>
          </ul>
        </div>
      </section>

      <section class="problem-section" aria-labelledby="reporting-broken">
        <div class="page-width split-section">
          <div class="section-heading">
            <p class="section-label">The challenge</p>
            <h2 id="reporting-broken">Why city reporting is broken today</h2>
          </div>
          <div class="section-copy">
            <ul class="detail-list">
              <li v-for="problem in problems" :key="problem.title">
                <strong>{{ problem.title }}</strong>
                <p>{{ problem.detail }}</p>
              </li>
            </ul>
            <p class="callout">CityFix is designed to fix exactly these three problems.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="page-width section-block" aria-labelledby="how-title">
        <div class="section-heading section-heading-wide">
          <p class="section-label">From voice to resolution</p>
          <h2 id="how-title">How CityFix works</h2>
        </div>
        <ol class="steps-list">
          <li>
            <h3>1. Residents speak, CityFix listens</h3>
            <p>
              From a mobile web page, a resident snaps a photo or records a short voice note
              describing an issue—potholes, overflowing garbage, broken lights, and more.
            </p>
          </li>
          <li>
            <h3>2. AI turns noise into structured data</h3>
            <p>
              CityFix uses AI to transcribe the voice note, understand the type of request, infer
              priority and location, and package everything into a clean service ticket ready for
              action.
            </p>
          </li>
          <li>
            <h3>3. City teams track, triage, and resolve</h3>
            <p>
              On the city dashboard, staff see new requests in a table and Kanban view, update
              status with one click, and access full context—photo, map, priority, and history—for
              each case.
            </p>
          </li>
        </ol>
        <a class="text-link" href="#how-it-works">
          See how it works <span aria-hidden="true">↘</span>
        </a>
      </section>

      <section class="audience-section">
        <div class="page-width audience-grid">
          <div class="audience-column">
            <h2>What residents experience</h2>
            <ul class="detail-list">
              <li v-for="item in residentsGet" :key="item.title">
                <strong>{{ item.title }}</strong>
                <p>{{ item.detail }}</p>
              </li>
            </ul>
          </div>
          <div class="audience-column">
            <h2>What city teams get</h2>
            <ul class="detail-list">
              <li v-for="item in cityTeamsGet" :key="item.title">
                <strong>{{ item.title }}</strong>
                <p>{{ item.detail }}</p>
              </li>
            </ul>
            <a class="text-link" href="#contact">
              Talk to us about your city <span aria-hidden="true">↘</span>
            </a>
          </div>
        </div>
      </section>

      <section class="page-width split-section section-block" aria-labelledby="services-title">
        <div class="section-heading">
          <p class="section-label">Flexible by design</p>
          <h2 id="services-title">Designed for any kind of city service</h2>
        </div>
        <div class="section-copy">
          <p>CityFix is built to support a wide range of municipal services from day one:</p>
          <ul class="detail-list compact-list">
            <li v-for="service in services" :key="service.title">
              <strong>{{ service.title }}</strong> {{ service.detail }}
            </li>
          </ul>
          <p>
            You choose which categories to start with; CityFix handles the routing logic in the
            background.
          </p>
        </div>
      </section>

      <section class="technology-section" aria-labelledby="technology-title">
        <div class="page-width split-section">
          <div class="section-heading">
            <p class="section-label">A capable assistant, not a black box</p>
            <h2 id="technology-title">Under the hood: voice and AI that work for you</h2>
          </div>
          <div class="section-copy">
            <p>CityFix combines modern AI and voice technology to do the heavy lifting:</p>
            <ul class="detail-list compact-list">
              <li v-for="feature in aiFeatures" :key="feature.title">
                <strong>{{ feature.title }}</strong> {{ feature.detail }}
              </li>
            </ul>
            <p>
              Your teams stay in control: every ticket can be edited, reassigned, and annotated
              from the dashboard before work is dispatched.
            </p>
          </div>
        </div>
      </section>

      <section class="page-width split-section section-block" aria-labelledby="goals-title">
        <div class="section-heading">
          <p class="section-label">Public value</p>
          <h2 id="goals-title">Aligning with your city’s goals</h2>
        </div>
        <ul class="detail-list section-copy">
          <li v-for="goal in cityGoals" :key="goal.title">
            <strong>{{ goal.title }}</strong>
            <p>{{ goal.detail }}</p>
          </li>
        </ul>
      </section>

      <section class="who-section" aria-labelledby="who-title">
        <div class="page-width split-section">
          <div class="section-heading">
            <p class="section-label">For the people doing the work</p>
            <h2 id="who-title">Who CityFix is for</h2>
          </div>
          <div class="section-copy">
            <ul class="detail-list compact-list">
              <li v-for="audience in audiences" :key="audience.title">
                <strong>{{ audience.title }}</strong> {{ audience.detail }}
              </li>
            </ul>
            <p>
              If you’re running a 311 service, a civic engagement office, or a smart-city
              initiative, CityFix is designed for you.
            </p>
          </div>
        </div>
      </section>

      <section id="scenario" class="page-width section-block" aria-labelledby="scenario-title">
        <div class="scenario-heading">
          <p class="section-label">A day in the life of a report</p>
          <h2 id="scenario-title">Example scenario</h2>
        </div>
        <ol class="scenario-list">
          <li v-for="step in scenario" :key="step">{{ step }}</li>
        </ol>
      </section>

      <section class="pilot-section" aria-labelledby="pilot-title">
        <div class="page-width pilot-content">
          <div>
            <p class="section-label">A practical first step</p>
            <h2 id="pilot-title">Start small. Prove the value fast.</h2>
            <p>CityFix is built to start as a pilot, not a multi-year overhaul:</p>
          </div>
          <ol class="pilot-list">
            <li v-for="step in pilotSteps" :key="step">{{ step }}</li>
          </ol>
          <a class="button button-primary" href="#contact">Request a pilot</a>
        </div>
      </section>

      <section id="demo" class="page-width closing-section" aria-labelledby="demo-title">
        <div class="closing-block">
          <h2>Demo and contact</h2>
          <div class="closing-grid">
            <div>
              <h3 id="demo-title">Live demo</h3>
              <p>
                See CityFix in action with a guided demo of the resident flow and city dashboard.
              </p>
              <a class="text-link" href="#demo">
                See the live demo <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div id="contact">
              <h3>Contact</h3>
              <p>Interested in a pilot for your city or region?</p>
              <a class="button button-primary" href="mailto:hello@cityfix.app">Request a pilot</a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer page-width">
      <a class="wordmark" href="#top">CityFix</a>
      <a href="#top">Back to top ↑</a>
    </footer>
  </div>
</template>

<style scoped>
.homepage-preview {
  --page: var(--bg, #e8e0d0);
  --paper: var(--surface-raised, #fbf7ef);
  --ink: var(--text-h, #1a1814);
  --body: var(--text, #3d3a33);
  --muted: var(--text-muted, #6f6a60);
  --brand-accent: var(--accent, #7a5c32);
  --line: var(--border, #d0c6b4);
  min-height: 100vh;
  color: var(--body);
  background: var(--page);
}

.homepage-preview *,
.homepage-preview *::before,
.homepage-preview *::after {
  box-sizing: border-box;
}

.page-width,
.site-header {
  width: min(100% - 3rem, 72rem);
  margin-inline: auto;
}

.site-header {
  min-height: 5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border-bottom: 1px solid var(--line);
}

.wordmark {
  color: var(--ink);
  font-weight: 800;
  letter-spacing: -0.04em;
  text-decoration: none;
}

.wordmark span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0;
}

.site-header nav {
  display: flex;
  align-items: center;
  gap: clamp(0.8rem, 2.5vw, 2rem);
}

.site-header nav a,
.site-footer a:not(.wordmark) {
  color: var(--body);
  font-size: 0.88rem;
  font-weight: 650;
  text-decoration: none;
}

.site-header nav a:hover,
.site-footer a:hover,
.text-link:hover {
  color: var(--brand-accent);
}

.site-header nav .nav-cta {
  color: var(--brand-accent);
}

.skip-link {
  position: absolute;
  z-index: 2;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.65rem 0.9rem;
  transform: translateY(-160%);
  color: white;
  background: var(--ink);
}

.skip-link:focus {
  transform: translateY(0);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(18rem, 0.9fr);
  align-items: center;
  gap: clamp(2rem, 7vw, 6rem);
  padding-block: clamp(4rem, 9vw, 8rem);
}

.hero h1,
.section-heading h2,
.scenario-heading h2,
.pilot-content h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(2rem, 4.2vw, 3.75rem);
  font-weight: 720;
  letter-spacing: -0.045em;
  line-height: 1.04;
  text-wrap: balance;
}

.hero h1 {
  max-width: 12ch;
  font-size: clamp(3rem, 7.5vw, 6rem);
}

.hero-lede {
  max-width: 57ch;
  margin: 1.5rem 0 0;
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  line-height: 1.65;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.button {
  display: inline-flex;
  min-height: 2.9rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.1rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.button:hover {
  transform: translateY(-2px);
}

.button-primary {
  color: var(--paper);
  background: var(--brand-accent);
}

.button-primary:hover {
  background: var(--accent-hover, #634a28);
}

.button-light {
  border-color: var(--line);
  color: var(--ink);
  background: var(--paper);
}

.button-light:hover {
  background: white;
}

.inbox-preview {
  position: relative;
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 0.5rem;
  color: #f7f1e6;
  background: #1c2430;
  box-shadow: 0 18px 40px rgba(28, 36, 48, 0.18);
}

.inbox-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #e4d8bf;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.status-dot::before {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.4rem;
  border-radius: 50%;
  background: #c8a768;
  content: '';
  vertical-align: 0.04rem;
}

.inbox-preview h2 {
  margin: 2.5rem 0 0;
  color: white;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.report-meta {
  margin: 0.8rem 0 2rem;
  color: #ded6c9;
  font-size: 0.92rem;
}

.status-flow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0;
  padding: 1.1rem 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  list-style: none;
}

.status-flow li {
  display: grid;
  gap: 0.5rem;
  color: #ded6c9;
  font-size: 0.78rem;
}

.status-flow li span {
  display: grid;
  width: 1.65rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid #a9a39b;
  border-radius: 50%;
  font-size: 0.7rem;
}

.status-flow li.is-current span {
  border-color: #c8a768;
  color: #1c2430;
  background: #c8a768;
}

.intro-section,
.split-section {
  display: grid;
  grid-template-columns: minmax(12rem, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(2rem, 7vw, 7rem);
}

.intro-section {
  padding-block: clamp(3rem, 7vw, 6rem);
  border-top: 1px solid var(--line);
}

.section-heading h2,
.scenario-heading h2,
.pilot-content h2 {
  font-size: clamp(1.8rem, 3.4vw, 3rem);
}

.section-label {
  margin: 0 0 0.7rem;
  color: var(--brand-accent);
  font-size: 0.74rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.section-copy {
  max-width: 66ch;
  font-size: 1rem;
  line-height: 1.7;
}

.section-copy > :first-child {
  margin-top: 0;
}

.check-list,
.detail-list,
.steps-list,
.scenario-list,
.pilot-list {
  margin: 1.4rem 0 0;
  padding: 0;
  list-style: none;
}

.check-list {
  display: grid;
  gap: 0.7rem;
}

.check-list li {
  position: relative;
  padding-left: 1.4rem;
}

.check-list li::before {
  position: absolute;
  left: 0;
  color: var(--brand-accent);
  content: '✓';
  font-weight: 800;
}

.problem-section,
.audience-section,
.technology-section,
.who-section {
  padding-block: clamp(3.5rem, 8vw, 7rem);
  background: var(--paper);
}

.problem-section .section-heading h2,
.audience-section h2,
.technology-section .section-heading h2,
.who-section .section-heading h2 {
  max-width: 14ch;
}

.detail-list {
  display: grid;
  gap: 1.15rem;
}

.detail-list li {
  padding-bottom: 1.05rem;
  border-bottom: 1px solid var(--line);
}

.detail-list li:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.detail-list strong {
  color: var(--ink);
}

.detail-list p {
  margin: 0.2rem 0 0;
}

.callout {
  margin: 1.6rem 0 0;
  color: var(--ink);
  font-weight: 750;
}

.section-block {
  padding-block: clamp(4rem, 8vw, 7rem);
}

.section-heading-wide {
  max-width: 40rem;
  margin-bottom: 2.5rem;
}

.steps-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1.2rem, 3vw, 3rem);
}

.steps-list li {
  padding-top: 1rem;
  border-top: 2px solid var(--brand-accent);
}

.steps-list h3 {
  margin: 0;
  color: var(--ink);
  font-size: 1.2rem;
  letter-spacing: -0.02em;
}

.steps-list p {
  margin: 0.75rem 0 0;
  line-height: 1.7;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 1.5rem;
  color: var(--ink);
  font-weight: 750;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}

.audience-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(2rem, 7vw, 7rem);
}

.audience-column h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(1.8rem, 3.3vw, 2.8rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.audience-column .detail-list {
  margin-top: 1.5rem;
}

.compact-list {
  gap: 0.7rem;
}

.compact-list li {
  padding-bottom: 0.7rem;
}

.technology-section {
  color: #f7f1e6;
  background: #1c2430;
}

.technology-section .section-heading h2,
.technology-section .section-copy,
.technology-section .detail-list strong {
  color: #f7f1e6;
}

.technology-section .section-label {
  color: #dec48e;
}

.technology-section .detail-list li {
  border-color: rgba(247, 241, 230, 0.24);
}

.who-section {
  background: #ddd3c2;
}

.scenario-heading {
  max-width: 42rem;
  margin-bottom: 2rem;
}

.scenario-list {
  counter-reset: scenario;
  display: grid;
  gap: 0;
  max-width: 58rem;
}

.scenario-list li {
  counter-increment: scenario;
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  padding: 1rem 0;
  border-top: 1px solid var(--line);
  line-height: 1.65;
}

.scenario-list li::before {
  color: var(--brand-accent);
  content: counter(scenario, decimal-leading-zero);
  font-size: 0.82rem;
  font-weight: 800;
}

.pilot-section {
  padding-block: clamp(3.5rem, 8vw, 6rem);
  color: #f7f1e6;
  background: #384654;
}

.pilot-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: end;
  gap: 1rem 4rem;
}

.pilot-content h2 {
  max-width: 14ch;
  color: white;
}

.pilot-content > div > p:last-child {
  max-width: 40ch;
  margin-bottom: 0;
  color: #e1dfda;
  line-height: 1.65;
}

.pilot-content .section-label {
  color: #e5c980;
}

.pilot-list {
  display: grid;
  gap: 0.8rem;
  margin: 0;
  padding-left: 1.2rem;
  list-style: decimal;
  line-height: 1.6;
}

.pilot-content .button {
  justify-self: start;
}

.closing-section {
  padding-block: clamp(4rem, 8vw, 7rem);
}

.closing-block {
  padding-top: 2rem;
  border-top: 1px solid var(--line);
}

.closing-block > h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(2rem, 4vw, 3.5rem);
  letter-spacing: -0.045em;
}

.closing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.closing-grid > div {
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.closing-grid h3 {
  margin: 0;
  color: var(--ink);
  font-size: 1.25rem;
}

.closing-grid p {
  max-width: 48ch;
  line-height: 1.65;
}

.closing-grid .button {
  margin-top: 0.3rem;
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.5rem;
  border-top: 1px solid var(--line);
}

.homepage-preview :focus-visible {
  outline: 3px solid #a16d28;
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .page-width,
  .site-header {
    width: min(100% - 2rem, 42rem);
  }

  .site-header {
    min-height: 4.5rem;
  }

  .site-header nav {
    gap: 0.8rem;
  }

  .site-header nav a {
    font-size: 0.78rem;
  }

  .site-header nav a:first-child {
    display: none;
  }

  .wordmark span {
    display: none;
  }

  .hero,
  .intro-section,
  .split-section,
  .audience-grid,
  .pilot-content {
    grid-template-columns: 1fr;
  }

  .hero {
    gap: 2.5rem;
    padding-block: 3.5rem;
  }

  .hero h1 {
    max-width: 11ch;
  }

  .inbox-preview {
    max-width: 34rem;
  }

  .intro-section,
  .split-section {
    gap: 1.5rem;
  }

  .steps-list {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .pilot-content {
    gap: 1.5rem;
  }

  .pilot-content .button {
    grid-row: 3;
  }
}

@media (max-width: 420px) {
  .site-header nav {
    gap: 0.65rem;
  }

  .site-header nav a {
    font-size: 0.72rem;
  }

  .actions {
    align-items: stretch;
  }

  .actions .button {
    flex: 1 1 100%;
  }

  .status-flow li {
    font-size: 0.7rem;
  }

  .closing-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
</style>
