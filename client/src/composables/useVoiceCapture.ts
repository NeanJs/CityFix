import { onBeforeUnmount, ref } from 'vue'
import { compressVoiceFile } from '../services/media/compressAudio'
import { createSpeechEndpoint } from '../services/media/speechEndpoint'

const minRecordingMs = 3000

function recorderMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return types.find((type) => MediaRecorder.isTypeSupported(type))
}

export function useVoiceCapture() {
  const recording = ref(false)
  const encoding = ref(false)
  const elapsed = ref(0)
  const audioUrl = ref('')
  const audioBlob = ref<Blob | null>(null)
  const errorKey = ref('')

  const mediaStream = ref<MediaStream | null>(null)
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let timer: number | null = null
  let startedAt = 0
  let captureGeneration = 0
  let encodePromise: Promise<Blob | null> | null = null
  let stopResolve: ((blob: Blob | null) => void) | null = null
  let endpointClosing = false

  const endpoint = createSpeechEndpoint({
    onEnded: () => {
      if (endpointClosing || !recording.value) {
        return
      }
      void stop()
    },
    onCancel: () => {
      if (endpointClosing || !recording.value) {
        return
      }
      cancel()
    },
  })

  function clearTimer() {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  function revokeUrl() {
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
      audioUrl.value = ''
    }
  }

  function stopStream() {
    mediaStream.value?.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }

  function stopEndpoint() {
    endpointClosing = true
    endpoint.stop()
    endpointClosing = false
  }

  async function finalizeRecording(raw: Blob, generation: number) {
    encoding.value = true
    try {
      const file = await compressVoiceFile(raw)
      if (generation !== captureGeneration) {
        return null
      }
      revokeUrl()
      audioBlob.value = file
      audioUrl.value = URL.createObjectURL(file)
      return file
    } catch {
      if (generation !== captureGeneration) {
        return null
      }
      revokeUrl()
      audioBlob.value = null
      errorKey.value = 'report.voiceEncodeFailed'
      return null
    } finally {
      if (generation === captureGeneration) {
        encoding.value = false
      }
      encodePromise = null
    }
  }

  async function start() {
    if (recording.value || encoding.value) {
      return
    }
    captureGeneration += 1
    errorKey.value = ''
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      errorKey.value = 'report.voiceUnavailable'
      return
    }
    endpoint.prime()
    try {
      mediaStream.value = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      errorKey.value = name === 'NotAllowedError' ? 'report.voiceDenied' : 'report.voiceFailed'
      return
    }
    revokeUrl()
    audioBlob.value = null
    chunks = []
    const mimeType = recorderMime()
    const stream = mediaStream.value
    if (!stream) {
      return
    }
    mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    const generation = captureGeneration
    mediaRecorder.onstop = () => {
      const durationMs = Date.now() - startedAt
      const recorded = chunks
      const type = mediaRecorder?.mimeType || 'audio/webm'
      chunks = []
      stopStream()
      mediaRecorder = null
      if (durationMs < minRecordingMs) {
        if (generation === captureGeneration) {
          encoding.value = false
          elapsed.value = 0
        }
        stopResolve?.(null)
        stopResolve = null
        encodePromise = null
        return
      }
      const blob = new Blob(recorded, { type })
      encodePromise = finalizeRecording(blob, generation)
      void encodePromise.then((file) => {
        stopResolve?.(file)
        stopResolve = null
      })
    }
    mediaRecorder.start()
    recording.value = true
    startedAt = Date.now()
    elapsed.value = 0
    timer = window.setInterval(() => {
      elapsed.value = Math.floor((Date.now() - startedAt) / 1000)
    }, 250)
    endpoint.attach(stream)
  }

  function stop() {
    stopEndpoint()
    if (encoding.value && encodePromise) {
      return encodePromise
    }
    if (!recording.value) {
      return Promise.resolve(audioBlob.value)
    }
    recording.value = false
    encoding.value = true
    clearTimer()
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      return new Promise<Blob | null>((resolve) => {
        const recorder = mediaRecorder
        if (!recorder) {
          encoding.value = false
          stopStream()
          resolve(audioBlob.value)
          return
        }
        stopResolve = resolve
        try {
          recorder.stop()
        } catch {
          encoding.value = false
          stopStream()
          mediaRecorder = null
          resolve(null)
        }
      })
    }
    stopStream()
    return Promise.resolve(audioBlob.value)
  }

  function discardRecorder() {
    chunks = []
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.ondataavailable = null
      mediaRecorder.onstop = () => {
        stopStream()
        mediaRecorder = null
      }
      try {
        mediaRecorder.stop()
      } catch {
        stopStream()
        mediaRecorder = null
      }
      return
    }
    stopStream()
    mediaRecorder = null
  }

  function cancel() {
    if (!recording.value) {
      return
    }
    captureGeneration += 1
    stopEndpoint()
    recording.value = false
    encoding.value = false
    encodePromise = null
    stopResolve?.(null)
    stopResolve = null
    clearTimer()
    discardRecorder()
    elapsed.value = 0
  }

  function reset() {
    captureGeneration += 1
    stopEndpoint()
    encoding.value = false
    encodePromise = null
    stopResolve?.(null)
    stopResolve = null
    if (recording.value) {
      recording.value = false
      clearTimer()
      discardRecorder()
    }
    revokeUrl()
    audioBlob.value = null
    elapsed.value = 0
    errorKey.value = ''
  }

  function formatElapsed() {
    const minutes = Math.floor(elapsed.value / 60)
      .toString()
      .padStart(2, '0')
    const seconds = (elapsed.value % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  onBeforeUnmount(() => {
    reset()
    endpoint.destroy()
  })

  return {
    recording,
    encoding,
    elapsed,
    mediaStream,
    audioUrl,
    audioBlob,
    errorKey,
    start,
    stop,
    reset,
    formatElapsed,
  }
}
