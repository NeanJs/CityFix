import { onBeforeUnmount, ref } from 'vue'
import { compressVoiceFile } from '../services/media/compressAudio'

function recognitionCtor() {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

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
  const transcript = ref('')
  const errorKey = ref('')
  const recognitionSupported = Boolean(recognitionCtor())

  const mediaStream = ref<MediaStream | null>(null)
  let mediaRecorder: MediaRecorder | null = null
  let recognition: SpeechRecognition | null = null
  let chunks: Blob[] = []
  let timer: number | null = null
  let startedAt = 0
  let captureGeneration = 0
  let encodePromise: Promise<Blob | null> | null = null
  let stopResolve: ((blob: Blob | null) => void) | null = null

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

  function stopRecognition() {
    if (!recognition) {
      return
    }
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    try {
      recognition.stop()
    } catch {
      /* already stopped */
    }
    recognition = null
  }

  function stopStream() {
    mediaStream.value?.getTracks().forEach((track) => track.stop())
    mediaStream.value = null
  }

  function startRecognition() {
    const Ctor = recognitionCtor()
    if (!Ctor) {
      return
    }
    const session = new Ctor()
    session.continuous = true
    session.interimResults = true
    session.lang = 'en-US'
    session.onresult = (event) => {
      let text = ''
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index][0].transcript
      }
      transcript.value = text.trim()
    }
    session.onerror = () => {
      /* typed description remains available */
    }
    session.onend = () => {
      if (recording.value) {
        try {
          session.start()
        } catch {
          /* session ended */
        }
      }
    }
    recognition = session
    try {
      session.start()
    } catch {
      recognition = null
    }
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
    try {
      mediaStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      errorKey.value = name === 'NotAllowedError' ? 'report.voiceDenied' : 'report.voiceFailed'
      return
    }
    revokeUrl()
    audioBlob.value = null
    chunks = []
    transcript.value = ''
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
      const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      stopStream()
      mediaRecorder = null
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
    startRecognition()
  }

  function stop() {
    if (encoding.value && encodePromise) {
      return encodePromise
    }
    if (!recording.value) {
      return Promise.resolve(audioBlob.value)
    }
    recording.value = false
    encoding.value = true
    clearTimer()
    stopRecognition()
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

  function reset() {
    captureGeneration += 1
    encoding.value = false
    encodePromise = null
    stopResolve?.(null)
    stopResolve = null
    if (recording.value) {
      recording.value = false
      clearTimer()
      stopRecognition()
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.onstop = () => {
          stopStream()
          mediaRecorder = null
        }
        try {
          mediaRecorder.stop()
        } catch {
          /* already stopped */
        }
      }
      stopStream()
      mediaRecorder = null
    }
    revokeUrl()
    audioBlob.value = null
    transcript.value = ''
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
  })

  return {
    recording,
    encoding,
    elapsed,
    mediaStream,
    audioUrl,
    audioBlob,
    transcript,
    errorKey,
    recognitionSupported,
    start,
    stop,
    reset,
    formatElapsed,
  }
}
