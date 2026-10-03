/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_TAGLINE?: string
  readonly VITE_MAP_STYLE?: string
  readonly VITE_MAP_STYLE_URL?: string
  readonly VITE_MAP_DEFAULT_LAT?: string
  readonly VITE_MAP_DEFAULT_LNG?: string
  readonly VITE_MAP_DEFAULT_ZOOM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}
