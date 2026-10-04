import { computed, ref } from 'vue'
import { reportTrackUrl } from '../config/apiConfig'
import { seedCitizenId } from '../data/seedUsers'
import { seedIssues } from '../data/seedIssues'
import { trackReport, type RemoteReport } from '../services/api/reportsApi'
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

function isoTimestamp(value: string | undefined) {
  if (!value) {
    return null
  }
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return null
  }
  return time
}

function remoteReportIsNewerThanLocal(current: Issue, remote: RemoteReport) {
  const remoteMs = isoTimestamp(remote.updatedAt)
  if (remoteMs === null) {
    return false
  }
  const localMs = isoTimestamp(current.updatedAt)
  if (localMs === null) {
    return true
  }
  return remoteMs > localMs
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
      trackingId: input.trackingId?.trim() || createTrackingId(issues.value.map((item) => item.trackingId)),
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
      recommendedAction: input.recommendedAction?.trim() || undefined,
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

  function getIssueByTrackingId(trackingId: string) {
    const needle = trackingId.trim().toLowerCase()
    if (!needle) {
      return undefined
    }
    return issues.value.find((issue) => issue.trackingId.toLowerCase() === needle)
  }

  function isoOr(value: string | undefined, fallback: string) {
    if (!value) {
      return fallback
    }
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) {
      return fallback
    }
    return new Date(time).toISOString()
  }

  async function saveRemoteReport(remote: RemoteReport, ownerId: string) {
    const now = new Date().toISOString()
    const index = issues.value.findIndex(
      (issue) => issue.trackingId.toLowerCase() === remote.trackingId.toLowerCase(),
    )
    if (index >= 0) {
      const current = issues.value[index]
      const acceptRemoteStatus = remoteReportIsNewerThanLocal(current, remote)
      const next: Issue = {
        ...current,
        title: remote.title || current.title,
        description: remote.description || current.description,
        transcript: remote.transcript || current.transcript,
        summary: remote.summary || current.summary,
        category: remote.category,
        severity: remote.severity,
        status: acceptRemoteStatus ? remote.status : current.status,
        locationLabel: remote.locationLabel || current.locationLabel,
        latitude: remote.latitude ?? current.latitude,
        longitude: remote.longitude ?? current.longitude,
        photoDataUrl: current.photoDataUrl || remote.photoUrl,
        recommendedAction: remote.recommendedAction || current.recommendedAction,
        createdAt: isoOr(remote.createdAt, current.createdAt),
        updatedAt: acceptRemoteStatus
          ? isoOr(remote.updatedAt, current.updatedAt)
          : current.updatedAt,
      }
      issues.value = [
        ...issues.value.slice(0, index),
        next,
        ...issues.value.slice(index + 1),
      ]
      await persist()
      return next
    }
    const createdAt = isoOr(remote.createdAt, now)
    const issue: Issue = {
      id: createId(),
      trackingId: remote.trackingId,
      title: remote.title,
      description: remote.description,
      transcript: remote.transcript,
      summary: remote.summary,
      category: remote.category,
      severity: remote.severity,
      status: remote.status,
      locationLabel: remote.locationLabel,
      latitude: remote.latitude,
      longitude: remote.longitude,
      photoDataUrl: remote.photoUrl,
      recommendedAction: remote.recommendedAction,
      reporterId: ownerId,
      createdAt,
      updatedAt: isoOr(remote.updatedAt, createdAt),
    }
    issues.value = [issue, ...issues.value]
    await persist()
    return issue
  }

  async function syncTrackedReport(trackingId: string, ownerId: string) {
    const id = trackingId.trim()
    if (!id) {
      return null
    }
    if (!reportTrackUrl(id)) {
      return getIssueByTrackingId(id) ?? null
    }
    const remote = await trackReport(id)
    return saveRemoteReport(remote, ownerId)
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
    getIssueByTrackingId,
    syncTrackedReport,
  }
}
