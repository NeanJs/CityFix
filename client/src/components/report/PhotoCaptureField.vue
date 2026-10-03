<script setup lang="ts">
import { ref } from 'vue'
import { useLocale } from '../../composables/useLocale'
import { compressImageFile } from '../../services/media/compressImage'

const photoDataUrl = defineModel<string>('photoDataUrl', { default: '' })

const { t } = useLocale()
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const errorKey = ref('')

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  errorKey.value = ''
  if (!file) {
    return
  }
  try {
    photoDataUrl.value = await compressImageFile(file)
  } catch {
    errorKey.value = 'report.photoFailed'
  }
}
</script>

<template>
  <div class="field">
    <span>{{ t('report.photo') }}</span>
    <p class="hint">{{ t('report.photoHint') }}</p>
    <div v-if="photoDataUrl" class="preview">
      <img :src="photoDataUrl" alt="" />
    </div>
    <div class="actions">
      <button type="button" class="btn-ghost" @click="cameraInput?.click()">
        {{ photoDataUrl ? t('report.retakePhoto') : t('report.takePhoto') }}
      </button>
      <button type="button" class="btn-ghost" @click="galleryInput?.click()">
        {{ t('report.choosePhoto') }}
      </button>
    </div>
    <p v-if="errorKey" class="error">{{ t(errorKey) }}</p>
    <input
      ref="cameraInput"
      class="file"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onFile"
    />
    <input ref="galleryInput" class="file" type="file" accept="image/*" @change="onFile" />
  </div>
</template>

<style scoped>
.field {
  position: relative;
  display: grid;
  gap: 0.4rem;
}

.field > span {
  font-size: 0.7rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.preview {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
}

.preview img {
  display: block;
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: #b42318;
}
</style>
