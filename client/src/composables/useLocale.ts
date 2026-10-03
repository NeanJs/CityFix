import { computed, ref } from 'vue'
import { en, type MessageTree } from '../locales/en'
import { readStoreItem, writeStoreItem } from '../services/storage/persistentStore'

export type LocaleCode = 'en'

type MessageParams = Record<string, string | number>

const localeKey = 'cityfix.locale.v1'
const dictionaries: Record<LocaleCode, MessageTree> = { en }
const fallbackLocale: LocaleCode = 'en'
const locale = ref<LocaleCode>(fallbackLocale)
const ready = ref(false)
let hydratePromise: Promise<void> | null = null

export const localeOptions: { id: LocaleCode; labelKey: string }[] = [
  { id: 'en', labelKey: 'language.en' },
]

function isLocaleCode(value: string): value is LocaleCode {
  return value in dictionaries
}

function lookup(tree: MessageTree, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = tree
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params?: MessageParams) {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`))
}

export async function hydrateLocale() {
  if (hydratePromise) {
    return hydratePromise
  }
  hydratePromise = (async () => {
    try {
      const stored = await readStoreItem(localeKey)
      if (stored && isLocaleCode(stored)) {
        locale.value = stored
      }
    } catch {
      locale.value = fallbackLocale
    }
    ready.value = true
  })()
  return hydratePromise
}

export function useLocale() {
  const messages = computed(() => dictionaries[locale.value] ?? dictionaries[fallbackLocale])

  function t(path: string, params?: MessageParams) {
    const value =
      lookup(messages.value, path) ?? lookup(dictionaries[fallbackLocale], path) ?? path
    return interpolate(value, params)
  }

  async function setLocale(next: LocaleCode) {
    locale.value = next
    await writeStoreItem(localeKey, next)
  }

  return {
    locale,
    ready,
    t,
    setLocale,
  }
}
