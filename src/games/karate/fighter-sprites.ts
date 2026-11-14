import type { SpriteAnimation } from './sprites';

export const FIGHTER_SPRITE_SIZE = {
  width: 32,
  height: 48,
} as const;

export const FIGHTER_ANIMATIONS: Record<string, SpriteAnimation> = {
  idle: {
    row: 0,
    frames: 4,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 10,
  },
  walk: {
    row: 1,
    frames: 6,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 6,
  },
  block: {
    row: 2,
    frames: 2,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 8,
  },
  punch: {
    row: 3,
    frames: 4,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 5,
  },
  kick: {
    row: 4,
    frames: 5,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 6,
  },
  low_kick: {
    row: 5,
    frames: 5,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 6,
  },
  hit: {
    row: 6,
    frames: 3,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 5,
  },
  ko: {
    row: 7,
    frames: 4,
    frameWidth: FIGHTER_SPRITE_SIZE.width,
    frameHeight: FIGHTER_SPRITE_SIZE.height,
    frameDuration: 8,
  },
};