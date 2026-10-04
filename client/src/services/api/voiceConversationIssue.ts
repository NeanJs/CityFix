import { voiceConversationIssueUrl } from '../../config/apiConfig'
import { ApiRequestError, apiRequestErrorFromResponse } from './apiRequestError'
import { parseReportIngestResponse } from './ingestReport'
import type { ReportIngestDraft } from '../../types/reportIngest'

const retryDelays = [800, 1200, 1600, 2000, 2500, 3000]

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delay)
  })
}

function shouldStopRetry(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    (error.code === 'unauthorized' ||
      error.code === 'unavailable' ||
      error.code === 'rate-limited')
  )
}

async function fetchVoiceConversationIssue(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    if (!response.ok) {
      throw apiRequestErrorFromResponse(response)
    }
    throw new ApiRequestError('failed')
  }
  if (!response.ok) {
    throw apiRequestErrorFromResponse(response)
  }
  return parseReportIngestResponse(payload)
}

export async function getVoiceConversationIssue(
  conversationId: string,
): Promise<ReportIngestDraft> {
  const id = conversationId.trim()
  const url = voiceConversationIssueUrl(id)
  if (!id || !url) {
    throw new ApiRequestError('unavailable')
  }

  let lastError: unknown
  for (const delay of retryDelays) {
    await wait(delay)
    try {
      return await fetchVoiceConversationIssue(url)
    } catch (error) {
      lastError = error
      if (shouldStopRetry(error)) {
        throw error
      }
    }
  }
  if (lastError) {
    throw lastError
  }
  throw new ApiRequestError('failed')
}
