<script setup lang="ts">
import { useLocale } from '../../composables/useLocale'
import { compressImageFile } from '../../services/media/compressImage'
import { ref } from 'vue'

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
    <span class="field-label">{{ t('report.photo') }}</span>
    <p class="hint">{{ t('report.photoHint') }}</p>
    <button type="button" class="stage" @click="cameraInput?.click()">
      <img v-if="photoDataUrl" :src="photoDataUrl" alt="" />
      <span v-else class="stage-empty">{{ t('report.takePhoto') }}</span>
    </button>
    <div class="actions">
      <button type="button" class="btn" @click="cameraInput?.click()">
        {{ photoDataUrl ? t('report.retakePhoto') : t('report.takePhoto') }}
      </button>
      <button type="button" class="btn-secondary" @click="galleryInput?.click()">
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
  gap: 0.45rem;
}

.stage {
  display: grid;
  place-items: center;
  min-height: 16rem;
  padding: 0;
  overflow: hidden;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  background: #f1f0f0;
  color: var(--text-muted);
  cursor: pointer;
}

.stage img {
  display: block;
  width: 100%;
  height: 16rem;
  object-fit: cover;
}

.stage-empty {
  font-size: 0.95rem;
  font-weight: 650;
  color: var(--text-h);
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
  color: var(--danger);
}

@media (min-width: 720px) {
  .stage,
  .stage img {
    min-height: 20rem;
    height: 20rem;
  }
}
</style>
