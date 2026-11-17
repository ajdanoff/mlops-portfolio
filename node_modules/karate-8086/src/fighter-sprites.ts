import type { SpriteAnimation } from './types';

export const FRAME = {
  LEFT_HAND_KICK: 0,
  UPPER_BLOCK: 1,
  STANCE: 2,
  YOKO_GERI: 3,
  KAE_MAE: 4,
  LOWER_BLOCK: 5,
  RIGHT_HAND_KICK: 6,
  KO: 7,
  NORMAL_STANCE: 8,
  MOVE_BACK: 9,
  MOVE_FORWARD: 10,
  MIDDLE_BLOCK: 11,
  BACK_KICK: 12,
} as const;

export const FIGHTER_ANIMATIONS: Record<string, SpriteAnimation> = {
  IDLE: {
    frames: [
      FRAME.NORMAL_STANCE,
      FRAME.STANCE,
    ],
    frameDuration: 16,
    loop: true,
  },

  WALK: {
    frames: [
      FRAME.NORMAL_STANCE,
      FRAME.MOVE_FORWARD,
      FRAME.NORMAL_STANCE,
    ],
    frameDuration: 6,
    loop: true,
  },

  WALK_BACK: {
    frames: [
      FRAME.NORMAL_STANCE,
      FRAME.MOVE_BACK,
      FRAME.NORMAL_STANCE,
    ],
    frameDuration: 6,
    loop: true,
  },

  BLOCK: {
    frames: [FRAME.UPPER_BLOCK],
    frameDuration: 4,
    loop: true,
  },

  MID_BLOCK: {
    frames: [FRAME.MIDDLE_BLOCK],
    frameDuration: 4,
    loop: true,
  },

  LOW_BLOCK: {
    frames: [FRAME.LOWER_BLOCK],
    frameDuration: 4,
    loop: true,
  },

  PUNCH: {
    frames: [
      FRAME.LEFT_HAND_KICK,
      FRAME.RIGHT_HAND_KICK,
    ],
    frameDuration: 8,
    loop: false,
  },

  KICK: {
    frames: [FRAME.YOKO_GERI],
    frameDuration: 8,
    loop: false,
  },

  LOW_KICK: {
    frames: [FRAME.KAE_MAE],
    frameDuration: 8,
    loop: false,
  },

  BACK_KICK: {
    frames: [FRAME.BACK_KICK],
    frameDuration: 9,
    loop: false,
  },

  DASH: {
    frames: [FRAME.MOVE_FORWARD],
    frameDuration: 3,
    loop: true,
  },

  STUN: {
    frames: [FRAME.KO],
    frameDuration: 5,
    loop: false,
  },

  KO: {
    frames: [FRAME.KO],
    frameDuration: 8,
    loop: false,
  },
};