import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'
import type { NavItem } from '../config/nav'

export function resolveNavActiveName(
  route: RouteLocationNormalizedLoaded,
  items: readonly NavItem[],
) {
  const name = route.name
  if (typeof name === 'string' && items.some((item) => item.name === name)) {
    return name
  }

  const path = route.path
  let best: NavItem | undefined
  for (const item of items) {
    const matches =
      path === item.path || (item.path !== '/' && path.startsWith(`${item.path}/`))
    if (matches && (!best || item.path.length > best.path.length)) {
      best = item
    }
  }

  if (best) {
    return best.name
  }

  return typeof name === 'string' ? name : ''
}

export function useNavActiveName(items: MaybeRefOrGetter<readonly NavItem[]>) {
  const route = useRoute()
  return computed(() => resolveNavActiveName(route, toValue(items)))
}
