import type { Fighter } from './types';
import { sfx } from './audio';

export function createFighter(isPlayer: boolean): Fighter {
  return {
    name: isPlayer ? 'AJDANOFF' : 'DOJO CPU',
    x: isPlayer ? 85 : 235,
    facing: isPlayer ? 1 : -1,
    hp: 100,
    maxHp: 100,
    state: 'IDLE',
    timer: 0,
    hasHit: false,
    dashCooldown: 0,
    combo: 0,
    giColor: isPlayer ? '#F8FAFC' : '#38BDF8',
    giShade: isPlayer ? '#CBD5E1' : '#0284C7',
    beltColor: isPlayer ? '#0F172A' : '#EF4444',
    headband: isPlayer ? '#EF4444' : '#FACC15',
  };
}

export function triggerAttack(
  fighter: Fighter,
  attack: 'PUNCH' | 'KICK' | 'LOW_KICK',
): void {
  const canAttack =
    fighter.state === 'IDLE' ||
    fighter.state === 'WALK';

  if (!canAttack) {
    return;
  }

  fighter.state = attack;
  fighter.hasHit = false;

  fighter.timer =
    attack === 'PUNCH'
      ? 18
      : attack === 'KICK'
        ? 26
        : 30;

  sfx.whiff();
}

export function tryDash(fighter: Fighter): void {
  const canDash =
    (fighter.state === 'IDLE' || fighter.state === 'WALK') &&
    fighter.dashCooldown === 0;

  if (!canDash) {
    return;
  }

  fighter.state = 'DASH';
  fighter.timer = 10;
  fighter.dashCooldown = 45;

  sfx.dash();
}