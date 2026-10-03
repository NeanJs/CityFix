import { Map, type MapOptions } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  defaultMapCenter,
  defaultMapZoom,
  resolveMapStyleUrl,
} from '../../config/mapConfig'
import { ensureMapLibreWorker } from './ensureMapLibreWorker'

export type CreateMapLibreMapOptions = Omit<MapOptions, 'container' | 'style'> & {
  container: string | HTMLElement
  style?: MapOptions['style']
}

export function createMapLibreMap(options: CreateMapLibreMapOptions) {
  ensureMapLibreWorker()

  return new Map({
    attributionControl: true,
    cooperativeGestures: true,
    fadeDuration: 0,
    style: resolveMapStyleUrl(),
    center: defaultMapCenter,
    zoom: defaultMapZoom,
    ...options,
  })
}
