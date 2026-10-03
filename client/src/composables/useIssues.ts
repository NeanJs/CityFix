import { computed, ref } from 'vue'
import { seedIssues } from '../data/seedIssues'
import { readStoreItem, writeStoreItem } from '../services/storage/persistentStore'
import type { Issue, IssueStatus, NewIssueInput } from '../types/issue'

const storageKey = 'cityfix.issues.v1'

const issues = ref<Issue[]>([])
const hydrated = ref(false)
const storeReady = ref(false)
let bootstrapPromise: Promise<void> | null = null

async function persist() {
  await writeStoreItem(storageKey, JSON.stringify(issues.value))
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
          issues.value = parsed
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

  async function addIssue(input: NewIssueInput) {
    const now = new Date().toISOString()
    const issue: Issue = {
      id: createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      status: 'submitted',
      locationLabel: input.locationLabel.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
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
    addIssue,
    updateStatus,
    getIssue,
  }
}
