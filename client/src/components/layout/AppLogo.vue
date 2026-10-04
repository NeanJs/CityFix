<script setup lang="ts">
import logoSrc from '../../assets/open_block_color.svg'
import { appName } from '../../config/appConfig'

const props = withDefaults(
  defineProps<{
    variant?: 'nav' | 'auth'
  }>(),
  {
    variant: 'nav',
  },
)
</script>

<template>
  <span class="app-logo-frame" :class="`app-logo-frame--${props.variant}`">
    <img class="app-logo" :src="logoSrc" :alt="appName" />
  </span>
</template>

<style scoped>
.app-logo-frame {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
}

.app-logo-frame--nav {
  height: 4.25rem;
}

.app-logo-frame--auth {
  height: 4.5rem;
  width: min(17.5rem, 100%);
}

.app-logo {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: left center;
}
</style>
