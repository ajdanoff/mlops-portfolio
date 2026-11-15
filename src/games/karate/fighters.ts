import type {
  AttackData,
  AttackType,
  BlockType,
  Fighter,
  FighterState,
} from './types';
import { CPU_PALETTE, PLAYER_PALETTE } from './palette';
import { sfx } from './audio';

const MOVABLE_STATES: FighterState[] = [
  'IDLE',
  'WALK',
  'WALK_BACK',
  'BLOCK',
  'MID_BLOCK',
  'LOW_BLOCK',
];

export const ATTACK_DATA = {
  PUNCH: {
    duration: 18,
    startup: 6,
    active: 5,
    recovery: 7,
    damage: 10,
    reach: 38,
    knockback: 10,
  },
  KICK: {
    duration: 26,
    startup: 9,
    active: 7,
    recovery: 10,
    damage: 16,
    reach: 48,
    knockback: 12,
  },
  LOW_KICK: {
    duration: 30,
    startup: 10,
    active: 8,
    recovery: 12,
    damage: 20,
    reach: 42,
    knockback: 15,
  },
  BACK_KICK: {
    duration: 34,
    startup: 12,
    active: 8,
    recovery: 14,
    damage: 22,
    reach: 34,
    knockback: 18,
  },
} as const satisfies Record<AttackType, AttackData>;

export function createFighter(isPlayer: boolean): Fighter {
  const palette = isPlayer ? PLAYER_PALETTE : CPU_PALETTE;

  return {
    name: isPlayer ? 'AJDANOFF' : 'DOJO CPU',
    isPlayer,
    x: isPlayer ? 85 : 235,
    facing: isPlayer ? 1 : -1,
    hp: 100,
    maxHp: 100,
    state: 'IDLE',
    timer: 0,
    animationTime: 0,
    hasHit: false,
    dashCooldown: 0,
    combo: 0,
    palette,
  };
}

export function setState(
  fighter: Fighter,
  state: FighterState,
): void {
  if (fighter.state === state) {
    return;
  }

  fighter.state = state;
  fighter.animationTime = 0;
}

export function triggerAttack(
  fighter: Fighter,
  attack: AttackType,
): void {
  if (!canAct(fighter)) {
    return;
  }

  const data = ATTACK_DATA[attack];

  setState(fighter, attack);

  fighter.timer = data.duration;
  fighter.hasHit = false;

  sfx.whiff();
}

export function triggerBlock(
  fighter: Fighter,
  blockType: BlockType,
): void {
  if (!canAct(fighter)) {
    return;
  }

  setState(fighter, blockType);

  fighter.timer = 18;
}

export function tryDash(fighter: Fighter): void {
  if (!canAct(fighter) || fighter.dashCooldown > 0) {
    return;
  }

  setState(fighter, 'DASH');

  fighter.timer = 10;
  fighter.dashCooldown = 45;

  sfx.dash();
}

export function canAct(fighter: Fighter): boolean {
  return MOVABLE_STATES.includes(fighter.state);
}

export function getAttackData(attack: AttackType): AttackData {
  return ATTACK_DATA[attack];
}