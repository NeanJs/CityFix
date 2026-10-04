import {
  Conversation,
  VoiceConversation,
  type Mode,
  type Status,
} from '@elevenlabs/client'
import { computed, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { elevenLabsAgentId } from '../config/elevenLabsConfig'

export type VoiceStatus = Status
export type VoiceMode = Mode

function isPermissionError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
  }
  const message = error instanceof Error ? error.message : String(error)
  return /notallowed|permission|denied/i.test(message)
}

function isUnavailableError(error: unknown) {
  if (error instanceof DOMException) {
    return (
      error.name === 'NotFoundError' ||
      error.name === 'NotReadableError' ||
      error.name === 'NotSupportedError'
    )
  }
  const message = error instanceof Error ? error.message : String(error)
  return /notfound|not readable|not supported|getusermedia|mediaDevices/i.test(message)
}

function errorKeyFromUnknown(error: unknown) {
  if (isPermissionError(error)) {
    return 'voice.micDenied'
  }
  if (isUnavailableError(error)) {
    return 'voice.unavailable'
  }
  return 'voice.failed'
}

export function useElevenLabsConversation() {
  const status = ref<VoiceStatus>('disconnected')
  const mode = ref<VoiceMode>('listening')
  const errorKey = ref('')
  const starting = ref(false)

  let session: VoiceConversation | null = null
  let generation = 0

  const connected = computed(() => status.value === 'connected')
  const sessionHeld = computed(
    () =>
      status.value === 'connecting' ||
      status.value === 'connected' ||
      status.value === 'disconnecting',
  )

  function readVolume(kind: 'input' | 'output') {
    if (!session) {
      return 0
    }
    try {
      const raw = kind === 'input' ? session.getInputVolume() : session.getOutputVolume()
      return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0
    } catch {
      return 0
    }
  }

  function getInputVolume() {
    return readVolume('input')
  }

  function getOutputVolume() {
    return readVolume('output')
  }

  async function startSession() {
    if (starting.value || sessionHeld.value) {
      return
    }
    if (!elevenLabsAgentId) {
      errorKey.value = 'voice.unavailable'
      return
    }

    starting.value = true
    errorKey.value = ''
    const token = generation + 1
    generation = token
    status.value = 'connecting'
    mode.value = 'listening'

    try {
      const next = await Conversation.startSession({
        agentId: elevenLabsAgentId,
        connectionType: 'webrtc',
        onStatusChange: ({ status: nextStatus }) => {
          if (token !== generation) {
            return
          }
          status.value = nextStatus
        },
        onModeChange: ({ mode: nextMode }) => {
          if (token !== generation) {
            return
          }
          mode.value = nextMode
        },
        onError: () => {
          if (token !== generation) {
            return
          }
          errorKey.value = 'voice.failed'
        },
        onDisconnect: () => {
          if (token !== generation) {
            return
          }
          session = null
          status.value = 'disconnected'
          mode.value = 'listening'
          starting.value = false
        },
      })

      if (token !== generation) {
        await next.endSession()
        return
      }

      if (next.type !== 'voice') {
        await next.endSession()
        session = null
        status.value = 'disconnected'
        errorKey.value = 'voice.failed'
        return
      }

      session = next
    } catch (error) {
      if (token !== generation) {
        return
      }
      session = null
      status.value = 'disconnected'
      mode.value = 'listening'
      errorKey.value = errorKeyFromUnknown(error)
    } finally {
      if (token === generation) {
        starting.value = false
      }
    }
  }

  async function endSession() {
    generation += 1
    starting.value = false
    const current = session
    session = null
    status.value = 'disconnected'
    mode.value = 'listening'
    if (!current) {
      return
    }
    try {
      await current.endSession()
    } catch {
      /* already closed */
    }
  }

  onBeforeRouteLeave(() => {
    void endSession()
  })

  onBeforeUnmount(() => {
    void endSession()
  })

  return {
    status,
    mode,
    errorKey,
    starting,
    connected,
    sessionHeld,
    startSession,
    endSession,
    getInputVolume,
    getOutputVolume,
  }
}
