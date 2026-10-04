export type ApiRequestErrorCode = 'not-found' | 'failed' | 'unavailable' | 'rate-limited'

export class ApiRequestError extends Error {
  readonly code: ApiRequestErrorCode
  readonly retryAfterSeconds?: number

  constructor(code: ApiRequestErrorCode, retryAfterSeconds?: number) {
    super(code)
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
    this.name = 'ApiRequestError'
  }
}

export function parseRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after')?.trim()
  if (!header) {
    return undefined
  }
  const asNumber = Number(header)
  if (Number.isFinite(asNumber) && asNumber >= 0) {
    return Math.ceil(asNumber)
  }
  const retryAt = Date.parse(header)
  if (Number.isNaN(retryAt)) {
    return undefined
  }
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
}

export function apiRequestErrorFromResponse(response: Response): ApiRequestError {
  if (response.status === 404) {
    return new ApiRequestError('not-found')
  }
  if (response.status === 429) {
    return new ApiRequestError('rate-limited', parseRetryAfterSeconds(response))
  }
  return new ApiRequestError('failed')
}

export function isApiRateLimited(error: unknown) {
  return error instanceof ApiRequestError && error.code === 'rate-limited'
}

type Translate = (path: string, params?: Record<string, string | number>) => string

export function formatRateLimitWait(retryAfterSeconds: number | undefined, t: Translate) {
  const seconds = retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : undefined
  if (!seconds) {
    return t('api.rateLimitedGeneric')
  }
  if (seconds < 90) {
    return t('api.rateLimitedSeconds', { count: Math.max(1, Math.ceil(seconds)) })
  }
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 90) {
    return t('api.rateLimitedMinutes', { count: minutes })
  }
  const hours = Math.ceil(minutes / 60)
  return t('api.rateLimitedHours', { count: hours })
}

export function apiErrorMessage(error: unknown, t: Translate, fallbackKey: string) {
  if (error instanceof ApiRequestError && error.code === 'rate-limited') {
    return formatRateLimitWait(error.retryAfterSeconds, t)
  }
  return t(fallbackKey)
}
