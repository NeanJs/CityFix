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
    <div class="stage" :class="{ filled: Boolean(photoDataUrl) }">
      <div class="preview">
        <img v-if="photoDataUrl" :src="photoDataUrl" :alt="t('report.photo')" />
        <div v-else class="empty">
          <p class="empty-title">{{ t('report.photoEmptyTitle') }}</p>
          <p class="empty-hint">{{ t('report.photoHint') }}</p>
        </div>
      </div>
      <div class="actions">
        <button
          type="button"
          :class="photoDataUrl ? 'btn-secondary' : 'btn'"
          @click="cameraInput?.click()"
        >
          {{ photoDataUrl ? t('report.retakePhoto') : t('report.takePhoto') }}
        </button>
        <button type="button" class="btn-secondary" @click="galleryInput?.click()">
          {{ t('report.choosePhoto') }}
        </button>
      </div>
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
  overflow: hidden;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  background: #f1f0f0;
}

.stage.filled {
  border-style: solid;
  background: #e8e6e3;
}

.preview {
  display: grid;
  min-height: 8.75rem;
}

.preview img {
  display: block;
  width: 100%;
  height: 9.5rem;
  object-fit: cover;
}

.empty {
  display: grid;
  align-content: center;
  gap: 0.2rem;
  min-height: 8.75rem;
  padding: 1rem 1.1rem;
}

.empty-title {
  margin: 0;
  color: var(--text-h);
  font-size: 1rem;
  font-weight: 700;
}

.empty-hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.7rem;
  border-top: 1px solid var(--border);
  background: var(--surface-solid);
}

.actions .btn,
.actions .btn-secondary {
  width: 100%;
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
  .preview,
  .empty {
    min-height: 11rem;
  }

  .preview img {
    height: 11rem;
  }
}
</style>
