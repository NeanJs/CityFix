const defaultAgentId = 'agent_7101k5zvyjhmfg983brhmhkd98n6'

export const elevenLabsAgentId = (
  import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim() || defaultAgentId
).trim()
