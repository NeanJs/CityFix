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
