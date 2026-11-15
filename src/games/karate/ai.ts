import type {
  AttackType,
  BlockType,
  FighterState,
  GameContext,
} from './types';
import { getAttackData, triggerAttack, tryDash } from './fighters';

let decisionCooldown = 0;
let reactionMemory = 0;
let lastPlayerAttack: AttackType | null = null;

const ATTACK_STATES: AttackType[] = [
  'PUNCH',
  'KICK',
  'LOW_KICK',
  'BACK_KICK',
];

const BLOCK_COUNTERS: Record<AttackType, BlockType> = {
  PUNCH: 'BLOCK',
  KICK: 'MID_BLOCK',
  LOW_KICK: 'LOW_BLOCK',
  BACK_KICK: 'LOW_BLOCK',
};

const PUNISH_ATTACK: Record<AttackType, AttackType> = {
  PUNCH: 'PUNCH',
  KICK: 'KICK',
  LOW_KICK: 'KICK',
  BACK_KICK: 'PUNCH',
};

export function updateAI(game: GameContext): void {
  const cpu = game.cpu;
  const player = game.player;

  if (isBusy(cpu.state)) {
    return;
  }

  const distance = Math.abs(cpu.x - player.x);

  cpu.facing = player.x < cpu.x ? -1 : 1;

  if (decisionCooldown > 0) {
    decisionCooldown--;

    if (cpu.state === 'WALK') {
      cpu.x += cpu.facing * 1.15;
    }

    if (cpu.state === 'WALK_BACK') {
      cpu.x -= cpu.facing * 1.1;
    }

    return;
  }

  const difficulty = getDifficulty(game.round);
  const playerAttack = getActivePlayerAttack(player.state);

  if (playerAttack) {
    reactToAttack(
      game,
      playerAttack,
      distance,
      difficulty,
    );

    return;
  }

  if (canPunishPlayer(player, distance, difficulty)) {
    punishPlayer(game, difficulty);

    return;
  }

  if (shouldDash(distance, difficulty)) {
    tryDash(cpu);

    return;
  }

  maintainSpacing(cpu, distance);

  if (cpu.state !== 'IDLE') {
    return;
  }

  chooseOffense(cpu, difficulty);
}

function isBusy(state: FighterState): boolean {
  return (
    state === 'STUN' ||
    state === 'KO' ||
    state === 'DASH' ||
    ATTACK_STATES.includes(state as AttackType)
  );
}

function getDifficulty(round: number): number {
  return Math.min(round - 1, 4);
}

function getActivePlayerAttack(
  state: FighterState,
): AttackType | null {
  return ATTACK_STATES.includes(state as AttackType)
    ? state as AttackType
    : null;
}

function reactToAttack(
  game: GameContext,
  playerAttack: AttackType,
  distance: number,
  difficulty: number,
): void {
  const cpu = game.cpu;
  const blockChance = 0.42 + difficulty * 0.08;
  const reactionRange = 52 + difficulty * 2;

  if (distance > reactionRange || Math.random() >= blockChance) {
    return;
  }

  cpu.state = BLOCK_COUNTERS[playerAttack];
  cpu.timer = 16;
  cpu.animationTime = 0;

  decisionCooldown = 14;
  reactionMemory = 20;
  lastPlayerAttack = playerAttack;

  void game;
}

function canPunishPlayer(
  player: GameContext['player'],
  distance: number,
  difficulty: number,
): boolean {
  const justAttacked =
    player.state === 'IDLE' &&
    lastPlayerAttack !== null &&
    reactionMemory > 0;

  const isInRange = distance <= 46;
  const punishChance = 0.18 + difficulty * 0.08;

  return justAttacked && isInRange && Math.random() < punishChance;
}

function punishPlayer(
  game: GameContext,
  difficulty: number,
): void {
  const cpu = game.cpu;
  const lastAttack = lastPlayerAttack;

  if (!lastAttack) {
    return;
  }

  const data = getAttackData(lastAttack);
  const attack = data.recovery >= 12
    ? PUNISH_ATTACK[lastAttack]
    : 'PUNCH';

  triggerAttack(cpu, attack);

  decisionCooldown = 24 - difficulty * 2;
  reactionMemory = 0;
  lastPlayerAttack = null;

  void game;
}

function shouldDash(
  distance: number,
  difficulty: number,
): boolean {
  const dashChance = 0.03 + difficulty * 0.012;

  return distance > 70 && Math.random() < dashChance;
}

function maintainSpacing(
  cpu: GameContext['cpu'],
  distance: number,
): void {
  if (distance > 44) {
    cpu.state = 'WALK';
    cpu.animationTime = 0;
    cpu.x += cpu.facing * 1.35;

    return;
  }

  if (distance < 26) {
    cpu.state = 'WALK_BACK';
    cpu.animationTime = 0;
    cpu.x -= cpu.facing * 1.2;

    return;
  }

  cpu.state = 'IDLE';
  cpu.animationTime = 0;
}

function chooseOffense(
  cpu: GameContext['cpu'],
  difficulty: number,
): void {
  const attackChance = 0.05 + difficulty * 0.016;
  const roll = Math.random();

  if (roll < attackChance) {
    triggerAttack(cpu, 'PUNCH');
    decisionCooldown = 22;
  } else if (roll < attackChance * 1.6) {
    triggerAttack(cpu, 'KICK');
    decisionCooldown = 28;
  } else if (roll < attackChance * 2.1) {
    triggerAttack(cpu, 'LOW_KICK');
    decisionCooldown = 30;
  } else if (roll < attackChance * 2.5) {
    triggerAttack(cpu, 'BACK_KICK');
    decisionCooldown = 26;
  } else if (roll < attackChance * 2.8) {
    cpu.state = 'BLOCK';
    cpu.timer = 18;
    cpu.animationTime = 0;
    decisionCooldown = 20;
  } else if (roll < attackChance * 3.1) {
    cpu.state = 'MID_BLOCK';
    cpu.timer = 16;
    cpu.animationTime = 0;
    decisionCooldown = 20;
  }
}

export function resetAI(): void {
  decisionCooldown = 0;
  reactionMemory = 0;
  lastPlayerAttack = null;
}