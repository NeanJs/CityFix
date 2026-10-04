import type { Issue, IssueSeverity } from '../../types/issue'
import { isOpenStatus } from '../report/statusFlow'

export type InsightsRange = 'all' | '30d' | '7d'

export type InsightAlertKind = 'critical' | 'stalled' | 'cluster' | 'unmapped'

export type InsightAlert = {
  kind: InsightAlertKind
  count: number
  issueIds: string[]
  location?: string
  issueType?: string
}

export type TrendPoint = {
  date: string
  filed: number
  resolved: number
}

export type CategoryInsight = {
  issueType: string
  total: number
  open: number
  resolutionRate: number
}

export type SeverityInsight = {
  severity: IssueSeverity
  open: number
  resolved: number
}

export type HotspotInsight = {
  location: string
  total: number
  open: number
  highSeverity: number
  issueIds: string[]
}

export type InsightsResult = {
  total: number
  resolutionRate: number
  averageResolutionHours: number | null
  backlog: number
  highSeverityOpen: number
  attentionRate: number
  sevenDayFiled: number
  sevenDayResolved: number
  velocityRatio: number | null
  trend: TrendPoint[]
  categories: CategoryInsight[]
  severities: SeverityInsight[]
  hotspots: HotspotInsight[]
  alerts: InsightAlert[]
}

const dayMs = 24 * 60 * 60 * 1000

function timestamp(value: string) {
  const result = new Date(value).getTime()
  return Number.isFinite(result) ? result : 0
}

function startOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

function dateKey(value: Date | number) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizedLocation(issue: Issue) {
  return issue.locationLabel.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function filteredByRange(issues: Issue[], range: InsightsRange, now: Date) {
  if (range === 'all') {
    return issues
  }
  const days = range === '7d' ? 7 : 30
  const threshold = startOfDay(now).getTime() - (days - 1) * dayMs
  return issues.filter((issue) => timestamp(issue.createdAt) >= threshold)
}

function buildTrend(issues: Issue[], range: InsightsRange, now: Date) {
  const validDates = issues.map((issue) => timestamp(issue.createdAt)).filter(Boolean)
  const today = startOfDay(now)
  const rangeDays =
    range === '7d'
      ? 7
      : range === '30d'
        ? 30
        : Math.min(90, Math.max(7, Math.ceil((today.getTime() - Math.min(...validDates, today.getTime())) / dayMs) + 1))
  const start = today.getTime() - (rangeDays - 1) * dayMs
  const points = new Map<string, TrendPoint>()

  for (let index = 0; index < rangeDays; index += 1) {
    const key = dateKey(start + index * dayMs)
    points.set(key, { date: key, filed: 0, resolved: 0 })
  }

  for (const issue of issues) {
    const createdKey = dateKey(timestamp(issue.createdAt))
    const createdPoint = points.get(createdKey)
    if (createdPoint) {
      createdPoint.filed += 1
    }
    if (issue.status === 'resolved') {
      const resolvedKey = dateKey(timestamp(issue.updatedAt))
      const resolvedPoint = points.get(resolvedKey)
      if (resolvedPoint) {
        resolvedPoint.resolved += 1
      }
    }
  }

  return [...points.values()]
}

function buildCategories(issues: Issue[]) {
  const categories = new Map<string, { total: number; open: number; resolved: number }>()
  for (const issue of issues) {
    const current = categories.get(issue.issueType) ?? { total: 0, open: 0, resolved: 0 }
    current.total += 1
    if (isOpenStatus(issue.status)) {
      current.open += 1
    }
    if (issue.status === 'resolved') {
      current.resolved += 1
    }
    categories.set(issue.issueType, current)
  }
  return [...categories.entries()]
    .map(([issueType, values]) => ({
      issueType,
      total: values.total,
      open: values.open,
      resolutionRate: values.total ? Math.round((values.resolved / values.total) * 100) : 0,
    }))
    .sort((left, right) => right.total - left.total)
}

function buildSeverities(issues: Issue[]) {
  const levels: IssueSeverity[] = ['high', 'medium', 'low']
  return levels.map((severity) => ({
    severity,
    open: issues.filter((issue) => issue.severity === severity && isOpenStatus(issue.status)).length,
    resolved: issues.filter((issue) => issue.severity === severity && issue.status === 'resolved').length,
  }))
}

function buildHotspots(issues: Issue[]) {
  const hotspots = new Map<string, HotspotInsight>()
  for (const issue of issues) {
    const key = normalizedLocation(issue)
    if (!key) {
      continue
    }
    const current = hotspots.get(key) ?? {
      location: issue.locationLabel.trim(),
      total: 0,
      open: 0,
      highSeverity: 0,
      issueIds: [],
    }
    current.total += 1
    current.open += isOpenStatus(issue.status) ? 1 : 0
    current.highSeverity += issue.severity === 'high' ? 1 : 0
    current.issueIds.push(issue.id)
    hotspots.set(key, current)
  }
  return [...hotspots.values()]
    .sort((left, right) => right.open - left.open || right.total - left.total)
    .slice(0, 6)
}

function buildAlerts(issues: Issue[], hotspots: HotspotInsight[], now: Date) {
  const nowMs = now.getTime()
  const critical = issues.filter(
    (issue) =>
      issue.severity === 'high' &&
      issue.status === 'queued' &&
      nowMs - timestamp(issue.createdAt) >= 2 * dayMs,
  )
  const stalled = issues.filter(
    (issue) =>
      issue.status === 'in_progress' &&
      nowMs - timestamp(issue.updatedAt) >= 7 * dayMs,
  )
  const unmapped = issues.filter(
    (issue) =>
      isOpenStatus(issue.status) &&
      (issue.latitude === undefined || issue.longitude === undefined),
  )
  const recurring = hotspots.find((hotspot) => hotspot.total >= 3)
  const alerts: InsightAlert[] = []

  if (critical.length) {
    alerts.push({ kind: 'critical', count: critical.length, issueIds: critical.map((issue) => issue.id) })
  }
  if (stalled.length) {
    alerts.push({ kind: 'stalled', count: stalled.length, issueIds: stalled.map((issue) => issue.id) })
  }
  if (recurring) {
    alerts.push({
      kind: 'cluster',
      count: recurring.total,
      issueIds: recurring.issueIds,
      location: recurring.location,
    })
  }
  if (unmapped.length) {
    alerts.push({ kind: 'unmapped', count: unmapped.length, issueIds: unmapped.map((issue) => issue.id) })
  }
  return alerts
}

export function calculateInsights(
  allIssues: Issue[],
  range: InsightsRange,
  now = new Date(),
): InsightsResult {
  const issues = filteredByRange(allIssues, range, now)
  const resolved = issues.filter((issue) => issue.status === 'resolved')
  const backlog = issues.filter((issue) => isOpenStatus(issue.status)).length
  const highSeverity = issues.filter((issue) => issue.severity === 'high')
  const highSeverityOpen = highSeverity.filter((issue) => isOpenStatus(issue.status)).length
  const resolutionDurations = resolved
    .map((issue) => timestamp(issue.updatedAt) - timestamp(issue.createdAt))
    .filter((duration) => duration >= 0)
  const sevenDayThreshold = startOfDay(now).getTime() - 6 * dayMs
  const sevenDayFiled = allIssues.filter((issue) => timestamp(issue.createdAt) >= sevenDayThreshold).length
  const sevenDayResolved = allIssues.filter(
    (issue) => issue.status === 'resolved' && timestamp(issue.updatedAt) >= sevenDayThreshold,
  ).length
  const hotspots = buildHotspots(issues)

  return {
    total: issues.length,
    resolutionRate: issues.length ? Math.round((resolved.length / issues.length) * 100) : 0,
    averageResolutionHours: resolutionDurations.length
      ? resolutionDurations.reduce((sum, duration) => sum + duration, 0) /
        resolutionDurations.length /
        (60 * 60 * 1000)
      : null,
    backlog,
    highSeverityOpen,
    attentionRate: highSeverity.length
      ? Math.round(((highSeverity.length - highSeverityOpen) / highSeverity.length) * 100)
      : 100,
    sevenDayFiled,
    sevenDayResolved,
    velocityRatio: sevenDayFiled ? sevenDayResolved / sevenDayFiled : null,
    trend: buildTrend(issues, range, now),
    categories: buildCategories(issues),
    severities: buildSeverities(issues),
    hotspots,
    alerts: buildAlerts(issues, hotspots, now),
  }
}
