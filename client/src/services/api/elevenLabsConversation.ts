import { elevenLabsApiKey } from '../../config/elevenLabsConfig'
import { peekVoiceReportHandoff } from '../voice/voiceReportHandoff'
import { ApiRequestError, apiRequestErrorFromResponse } from './apiRequestError'

type ConversationRole = 'user' | 'agent'

interface ConversationTranscriptEntry {
  role?: ConversationRole
  message?: string
}

interface ConversationDetails {
  status?: string
  transcript?: ConversationTranscriptEntry[]
}

const conversationApiUrl = 'https://api.elevenlabs.io/v1/convai/conversations'
const retryDelays = [800, 1200, 1600, 2000, 2500, 3000]
const pendingStatuses = new Set(['initiated', 'in-progress', 'in_progress', 'processing'])

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delay)
  })
}

function userTranscript(details: ConversationDetails) {
  return (details.transcript ?? [])
    .filter((entry) => entry.role === 'user')
    .map((entry) => entry.message?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n')
}

async function fetchConversation(conversationId: string) {
  const response = await fetch(`${conversationApiUrl}/${encodeURIComponent(conversationId)}`, {
    headers: {
      Accept: 'application/json',
      'xi-api-key': elevenLabsApiKey,
    },
  })
  if (!response.ok) {
    throw apiRequestErrorFromResponse(response)
  }
  try {
    return (await response.json()) as ConversationDetails
  } catch {
    throw new ApiRequestError('failed')
  }
}

export async function getConversationUserTranscript(conversationId: string) {
  const id = conversationId.trim()
  const fallback = peekVoiceReportHandoff(id)?.userTranscript.trim() ?? ''
  if (!id) {
    throw new ApiRequestError('unavailable')
  }

  if (elevenLabsApiKey) {
    let lastError: unknown
    let transcript = ''
    for (const delay of retryDelays) {
      await wait(delay)
      try {
        const details = await fetchConversation(id)
        transcript = userTranscript(details)
        if (transcript || !pendingStatuses.has(details.status?.toLowerCase() ?? '')) {
          break
        }
      } catch (error) {
        lastError = error
      }
    }
    if (transcript) {
      return transcript
    }
    if (fallback) {
      return fallback
    }
    if (lastError) {
      throw lastError
    }
    throw new ApiRequestError('failed')
  }

  if (fallback) {
    return fallback
  }
  throw new ApiRequestError('unavailable')
}
