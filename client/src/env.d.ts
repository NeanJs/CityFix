/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_TAGLINE?: string
  readonly VITE_MAP_STYLE?: string
  readonly VITE_MAP_STYLE_URL?: string
  readonly VITE_MAP_DEFAULT_LAT?: string
  readonly VITE_MAP_DEFAULT_LNG?: string
  readonly VITE_MAP_DEFAULT_ZOOM?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_REPORT_INGEST_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_ELEVENLABS_AGENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  webkitAudioContext?: typeof AudioContext
}

interface MediaTrackConstraintSet {
  voiceIsolation?: ConstrainBoolean
}

interface ViewTransition {
  finished: Promise<void>
}

interface Document {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransition
}
