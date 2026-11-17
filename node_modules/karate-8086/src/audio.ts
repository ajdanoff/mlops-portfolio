let muted = false;
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

const MASTER_VOLUME = 0.5;

type SoundName =
  | 'whiff'
  | 'punchHit'
  | 'kickHit'
  | 'lowHit'
  | 'backHit'
  | 'block'
  | 'lowBlock'
  | 'midBlock'
  | 'dash'
  | 'gong'
  | 'roundWin'
  | 'matchWin'
  | 'matchLose';

export const sfx = {
  whiff: () => playSound('whiff'),
  punchHit: () => playSound('punchHit'),
  kickHit: () => playSound('kickHit'),
  lowHit: () => playSound('lowHit'),
  backHit: () => playSound('backHit'),
  block: () => playSound('block'),
  lowBlock: () => playSound('lowBlock'),
  midBlock: () => playSound('midBlock'),
  dash: () => playSound('dash'),
  gong: () => playSound('gong'),
  roundWin: () => playSound('roundWin'),
  matchWin: () => playSound('matchWin'),
  matchLose: () => playSound('matchLose'),
};

export function unlockAudio(): void {
  getContext();
}

export function toggleMute(): boolean {
  muted = !muted;

  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(
      muted ? 0 : MASTER_VOLUME,
      audioContext.currentTime,
      0.02,
    );
  }

  return muted;
}

export function isMuted(): boolean {
  return muted;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!audioContext) {
    const Context = window.AudioContext ??
      (window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!Context) {
      return null;
    }

    audioContext = new Context();

    masterGain = audioContext.createGain();
    masterGain.gain.value = muted ? 0 : MASTER_VOLUME;
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  return audioContext;
}

function playSound(name: SoundName): void {
  const context = getContext();

  if (!context || !masterGain) {
    return;
  }

  switch (name) {
    case 'whiff':
      playTone(context, masterGain, {
        frequency: 280,
        duration: 0.07,
        type: 'square',
        slideTo: 120,
        volume: 0.16,
      });

      break;

    case 'punchHit':
      playNoiseBurst(context, masterGain, {
        duration: 0.09,
        filterFrequency: 1100,
        volume: 0.5,
      });

      playTone(context, masterGain, {
        frequency: 170,
        duration: 0.11,
        type: 'sawtooth',
        slideTo: 55,
        volume: 0.3,
      });

      break;

    case 'kickHit':
      playNoiseBurst(context, masterGain, {
        duration: 0.13,
        filterFrequency: 850,
        volume: 0.58,
      });

      playTone(context, masterGain, {
        frequency: 130,
        duration: 0.15,
        type: 'sawtooth',
        slideTo: 42,
        volume: 0.34,
      });

      break;

    case 'lowHit':
      playNoiseBurst(context, masterGain, {
        duration: 0.15,
        filterFrequency: 620,
        volume: 0.62,
      });

      playTone(context, masterGain, {
        frequency: 95,
        duration: 0.18,
        type: 'sawtooth',
        slideTo: 32,
        volume: 0.38,
      });

      break;

    case 'backHit':
      playNoiseBurst(context, masterGain, {
        duration: 0.16,
        filterFrequency: 520,
        volume: 0.68,
      });

      playTone(context, masterGain, {
        frequency: 80,
        duration: 0.2,
        type: 'sawtooth',
        slideTo: 28,
        volume: 0.4,
      });

      break;

    case 'block':
      playTone(context, masterGain, {
        frequency: 540,
        duration: 0.06,
        type: 'square',
        slideTo: 720,
        volume: 0.18,
      });

      break;

    case 'lowBlock':
      playTone(context, masterGain, {
        frequency: 330,
        duration: 0.08,
        type: 'square',
        slideTo: 190,
        volume: 0.2,
      });

      break;

    case 'midBlock':
      playTone(context, masterGain, {
        frequency: 430,
        duration: 0.07,
        type: 'square',
        slideTo: 260,
        volume: 0.2,
      });

      break;

    case 'dash':
      playTone(context, masterGain, {
        frequency: 760,
        duration: 0.05,
        type: 'square',
        slideTo: 240,
        volume: 0.14,
      });

      break;

    case 'gong':
      playTone(context, masterGain, {
        frequency: 196,
        duration: 0.5,
        type: 'triangle',
        slideTo: 138,
        volume: 0.26,
      });

      break;

    case 'roundWin':
      playSequence(context, masterGain, [
        { frequency: 330, duration: 0.1, delay: 0 },
        { frequency: 440, duration: 0.1, delay: 0.11 },
        { frequency: 659, duration: 0.22, delay: 0.22 },
      ]);

      break;

    case 'matchWin':
      playSequence(context, masterGain, [
        { frequency: 392, duration: 0.1, delay: 0 },
        { frequency: 523, duration: 0.1, delay: 0.1 },
        { frequency: 659, duration: 0.1, delay: 0.2 },
        { frequency: 784, duration: 0.3, delay: 0.3 },
      ]);

      break;

    case 'matchLose':
      playSequence(context, masterGain, [
        { frequency: 220, duration: 0.16, delay: 0 },
        { frequency: 165, duration: 0.18, delay: 0.18 },
        { frequency: 110, duration: 0.34, delay: 0.38 },
      ]);

      break;
  }
}

interface ToneOptions {
  frequency: number;
  duration: number;
  type: OscillatorType;
  slideTo?: number;
  volume: number;
}

function playTone(
  context: AudioContext,
  destination: AudioNode,
  options: ToneOptions,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, now);

  if (options.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      options.slideTo,
      now + options.duration,
    );
  }

  gain.gain.setValueAtTime(options.volume, now);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + options.duration,
  );

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(now);
  oscillator.stop(now + options.duration);
}

interface NoiseOptions {
  duration: number;
  filterFrequency: number;
  volume: number;
}

function playNoiseBurst(
  context: AudioContext,
  destination: AudioNode,
  options: NoiseOptions,
): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;

  source.buffer = getNoiseBuffer(context);

  filter.type = 'bandpass';
  filter.frequency.value = options.filterFrequency;
  filter.Q.value = 0.8;

  gain.gain.setValueAtTime(options.volume, now);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + options.duration,
  );

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  source.start(now);
  source.stop(now + options.duration);
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (noiseBuffer) {
    return noiseBuffer;
  }

  const duration = 0.2;
  const frameCount = Math.floor(context.sampleRate * duration);

  noiseBuffer = context.createBuffer(
    1,
    frameCount,
    context.sampleRate,
  );

  const channel = noiseBuffer.getChannelData(0);

  for (let index = 0; index < frameCount; index++) {
    channel[index] = Math.random() * 2 - 1;
  }

  return noiseBuffer;
}

interface ToneSequenceItem {
  frequency: number;
  duration: number;
  delay: number;
}

function playSequence(
  context: AudioContext,
  destination: AudioNode,
  items: ToneSequenceItem[],
): void {
  for (const item of items) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime + item.delay;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(item.frequency, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + item.duration,
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + item.duration);
  }
}