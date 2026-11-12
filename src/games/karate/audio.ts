let muted = false;
let audioContext: AudioContext | null = null;

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  slideTo?: number,
): void {
  if (muted) {
    return;
  }

  if (!audioContext) {
    const Context = window.AudioContext ??
      (window as unknown as {
        webkitAudioContext: typeof AudioContext;
      }).webkitAudioContext;

    audioContext = new Context();
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(now + duration);
}

export const sfx = {
  whiff: () => playTone(260, 0.08, 'square', 110),
  hit: () => playTone(150, 0.14, 'sawtooth', 45),
  lowHit: () => playTone(110, 0.18, 'sawtooth', 35),
  block: () => playTone(520, 0.07, 'square', 680),
  dash: () => playTone(720, 0.06, 'square', 220),
  gong: () => playTone(196, 0.45, 'triangle', 146),
  win: () => {
    playTone(330, 0.12, 'square');
    setTimeout(() => playTone(440, 0.12, 'square'), 130);
    setTimeout(() => playTone(659, 0.28, 'square'), 260);
  },
};

export function toggleMute(): boolean {
  muted = !muted;

  return muted;
}

export function isMuted(): boolean {
  return muted;
}