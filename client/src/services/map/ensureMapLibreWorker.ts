import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?worker&url'

let workerReady = false

export function ensureMapLibreWorker() {
  if (workerReady) {
    return
  }
  setWorkerUrl(workerUrl)
  workerReady = true
}
