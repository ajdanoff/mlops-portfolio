import type { GameContext } from './types';
import { triggerAttack, tryDash } from './fighters';

let decisionCooldown = 0;

export function updateAI(game: GameContext): void {
  const cpu = game.cpu;
  const player = game.player;

  if (cpu.state === 'STUN' || cpu.state === 'KO') {
    return;
  }

  const distance = Math.abs(cpu.x - player.x);
  cpu.facing = player.x < cpu.x ? -1 : 1;

  if (
    cpu.state === 'PUNCH' ||
    cpu.state === 'KICK' ||
    cpu.state === 'LOW_KICK' ||
    cpu.state === 'BACK_KICK' ||
    cpu.state === 'DASH'
  ) {
    return;
  }

  if (decisionCooldown > 0) {
    decisionCooldown--;
    return;
  }

  const difficulty = Math.min(game.round - 1, 4);
  const blockChance = 0.5 + difficulty * 0.07;
  const attackChance = 0.05 + difficulty * 0.015;

  const playerIsAttacking =
    player.state === 'PUNCH' ||
    player.state === 'KICK' ||
    player.state === 'LOW_KICK' ||
    player.state === 'BACK_KICK';

  if (playerIsAttacking && distance < 55 && Math.random() < blockChance) {
    cpu.state = player.state === 'LOW_KICK' ? 'LOW_BLOCK' : 'BLOCK';
    cpu.timer = 16;
    decisionCooldown = 14;
    return;
  }

  if (distance > 70 && Math.random() < 0.03 + difficulty * 0.01) {
    tryDash(cpu);
    return;
  }

  if (distance > 44) {
    cpu.state = 'WALK';
    cpu.x += cpu.facing * 1.35;
    return;
  }

  if (distance < 26) {
    cpu.state = 'WALK_BACK';
    cpu.x -= cpu.facing * 1.2;
    return;
  }

  cpu.state = 'IDLE';

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
    decisionCooldown = 20;
  }
}

export function resetAI(): void {
  decisionCooldown = 0;
}
