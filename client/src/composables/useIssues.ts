import { computed, ref } from 'vue'
import { seedCitizenId } from '../data/seedUsers'
import { seedIssues } from '../data/seedIssues'
import { createTrackingId, trackingIdFromInternal } from '../services/report/enrichReport'
import { readStoreItem, writeStoreItem } from '../services/storage/persistentStore'
import type { Issue, IssueSeverity, IssueStatus, NewIssueInput } from '../types/issue'

const storageKey = 'cityfix.issues.v1'

const issues = ref<Issue[]>([])
const hydrated = ref(false)
const storeReady = ref(false)
let bootstrapPromise: Promise<void> | null = null

const severities: IssueSeverity[] = ['low', 'medium', 'high']

async function persist() {
  await writeStoreItem(storageKey, JSON.stringify(issues.value))
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function isSeverity(value: unknown): value is IssueSeverity {
  return typeof value === 'string' && severities.includes(value as IssueSeverity)
}

function normalizeIssue(issue: Issue): Issue {
  const description = issue.description?.trim() ?? ''
  const transcript = issue.transcript?.trim() ?? ''
  return {
    ...issue,
    trackingId: issue.trackingId || trackingIdFromInternal(issue.id),
    reporterId: issue.reporterId || seedCitizenId,
    transcript,
    summary: issue.summary?.trim() || description || transcript,
    severity: isSeverity(issue.severity) ? issue.severity : 'medium',
    photoDataUrl: issue.photoDataUrl,
  }
}

export async function bootstrapIssues() {
  if (bootstrapPromise) {
    return bootstrapPromise
  }
  bootstrapPromise = (async () => {
    if (hydrated.value) {
      storeReady.value = true
      return
    }
    hydrated.value = true
    try {
      const raw = await readStoreItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Issue[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          issues.value = parsed.map(normalizeIssue)
          storeReady.value = true
          return
        }
      }
    } catch {
      /* use seed */
    }
    issues.value = [...seedIssues]
    await persist()
    storeReady.value = true
  })()
  return bootstrapPromise
}

export function useIssues() {
  const sortedIssues = computed(() =>
    [...issues.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  )

  const openCount = computed(
    () => issues.value.filter((issue) => issue.status !== 'resolved').length,
  )

  const resolvedCount = computed(
    () => issues.value.filter((issue) => issue.status === 'resolved').length,
  )

  const highSeverityCount = computed(
    () => issues.value.filter((issue) => issue.severity === 'high').length,
  )

  function issuesForReporter(reporterId: string) {
    return sortedIssues.value.filter((issue) => issue.reporterId === reporterId)
  }

  function issuesCreatedOn(day: Date) {
    const start = new Date(day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return issues.value.filter((issue) => {
      const created = new Date(issue.createdAt).getTime()
      return created >= start.getTime() && created < end.getTime()
    })
  }

  async function addIssue(input: NewIssueInput) {
    const now = new Date().toISOString()
    const issue: Issue = {
      id: createId(),
      trackingId: createTrackingId(issues.value.map((item) => item.trackingId)),
      title: input.title?.trim() || input.summary.trim(),
      description: input.description.trim(),
      transcript: input.transcript?.trim() ?? '',
      summary: input.summary.trim(),
      category: input.category,
      severity: input.severity,
      status: 'submitted',
      locationLabel: input.locationLabel.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      photoDataUrl: input.photoDataUrl,
      reporterId: input.reporterId,
      createdAt: now,
      updatedAt: now,
    }
    issues.value = [issue, ...issues.value]
    await persist()
    return issue
  }

  async function updateStatus(id: string, status: IssueStatus) {
    const index = issues.value.findIndex((issue) => issue.id === id)
    if (index === -1) {
      return
    }
    const next = { ...issues.value[index], status, updatedAt: new Date().toISOString() }
    issues.value = [
      ...issues.value.slice(0, index),
      next,
      ...issues.value.slice(index + 1),
    ]
    await persist()
  }

  function getIssue(id: string) {
    return issues.value.find((issue) => issue.id === id)
  }

  return {
    storeReady,
    issues: sortedIssues,
    openCount,
    resolvedCount,
    highSeverityCount,
    issuesForReporter,
    issuesCreatedOn,
    addIssue,
    updateStatus,
    getIssue,
  }
}
