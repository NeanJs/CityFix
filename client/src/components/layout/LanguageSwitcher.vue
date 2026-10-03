<script setup lang="ts">
import { localeOptions, useLocale } from '../../composables/useLocale'
import type { LocaleCode } from '../../composables/useLocale'

const { locale, t, setLocale } = useLocale()
</script>

<template>
  <label class="locale">
    <span class="sr">{{ t('language.label') }}</span>
    <select
      class="control locale-select"
      :value="locale"
      :aria-label="t('language.label')"
      @change="setLocale(($event.target as HTMLSelectElement).value as LocaleCode)"
    >
      <option v-for="option in localeOptions" :key="option.id" :value="option.id">
        {{ t(option.labelKey) }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.locale {
  display: block;
  min-width: 7.5rem;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.locale-select {
  min-height: 2.4rem;
  padding: 0.35rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 650;
}
</style>
