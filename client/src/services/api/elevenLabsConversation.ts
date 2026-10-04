import { elevenLabsApiKey } from '../../config/elevenLabsConfig'
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
const retryDelays = [0, 500, 1000, 1500, 2000, 2500]
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
  if (!id || !elevenLabsApiKey) {
    throw new ApiRequestError('unavailable')
  }

  let transcript = ''
  for (const delay of retryDelays) {
    if (delay) {
      await wait(delay)
    }
    const details = await fetchConversation(id)
    transcript = userTranscript(details)
    if (!pendingStatuses.has(details.status?.toLowerCase() ?? '')) {
      break
    }
  }

  if (!transcript) {
    throw new ApiRequestError('failed')
  }
  return transcript
}
