export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string) {
  if (!canSpeak()) {
    return false
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.96
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking() {
  if (canSpeak()) {
    window.speechSynthesis.cancel()
  }
}
