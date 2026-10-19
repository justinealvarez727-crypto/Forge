/**
 * Audio: read text aloud with the browser's built-in speech synthesis. Used for
 * review cards and prompt preview so the app is usable eyes-free. It degrades to a
 * no-op (and the buttons hide) where the Web Speech API is unavailable.
 */
export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, rate = 1): void {
  if (!speechSupported) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (speechSupported) window.speechSynthesis.cancel();
}
