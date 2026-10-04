export interface VoiceReportHandoff {
  conversationId: string
  userTranscript: string
}

let pending: VoiceReportHandoff | null = null

export function setVoiceReportHandoff(next: VoiceReportHandoff) {
  const conversationId = next.conversationId.trim()
  if (!conversationId) {
    return
  }
  pending = {
    conversationId,
    userTranscript: next.userTranscript.trim(),
  }
}

export function peekVoiceReportHandoff(conversationId: string) {
  const id = conversationId.trim()
  if (!id || pending?.conversationId !== id) {
    return null
  }
  return pending
}

export function takeVoiceReportHandoff(conversationId: string) {
  const current = peekVoiceReportHandoff(conversationId)
  if (!current) {
    return null
  }
  pending = null
  return current
}
