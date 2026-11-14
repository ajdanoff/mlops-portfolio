import type { Fighter, GameContext, Particle } from './types';
import { ARENA, MATCH } from './types';
import { createFighter } from './fighters';
import { updateAI, resetAI } from './ai';
import { sfx } from './audio';
import { loadFighterSprites } from './sprites';
import {
  drawBackground,
  drawFighter,
  drawParticles,
  drawHUD,
} from './renderer';
import { bindKeyboard, bindTouchControls, bindUiButtons } from './input';

export function initKarateGame(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not supported.');
  }

  context.imageSmoothingEnabled = false;
  loadFighterSprites();

  const game: GameContext = {
    canvas,
    context,
    player: createFighter(true),
    cpu: createFighter(false),
    particles: [],
    keys: {},
    phase: 'TITLE',
    banner: 'PRESS SPACE OR ATTACK TO START',
    round: 1,
    playerWins: 0,
    cpuWins: 0,
    roundTimer: MATCH.roundTime,
    screenShake: 0,
    hitFlash: 0,
    tick: 0,
  };

  bindKeyboard(game);
  bindTouchControls(game);
  bindUiButtons(game);

  let lastTimestamp = 0;

  const loop = (timestamp: number): void => {
    const deltaTime = lastTimestamp === 0
      ? 0
      : Math.min((timestamp - lastTimestamp) / 1000, 0.1);

    lastTimestamp = timestamp;
    game.tick++;

    if (game.phase !== 'PAUSED') {
      update(game, deltaTime);
    }

    render(game);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

function startRound(game: GameContext): void {
  game.player = createFighter(true);
  game.cpu = createFighter(false);
  game.particles = [];
  game.roundTimer = MATCH.roundTime;

  resetAI();

  game.phase = 'FIGHT';
  game.banner = '';

  sfx.gong();
}

export function resetMatch(game: GameContext): void {
  game.round = 1;
  game.playerWins = 0;
  game.cpuWins = 0;

  startRound(game);
}

export function startOrContinue(game: GameContext): void {
  if (game.phase === 'TITLE' || game.phase === 'PAUSED') {
    startRound(game);
    return;
  }

  if (game.phase === 'ROUND_OVER') {
    game.round++;
    startRound(game);
    return;
  }

  if (game.phase === 'MATCH_OVER') {
    resetMatch(game);
  }
}

function update(game: GameContext, deltaTime: number): void {
  if (game.phase !== 'FIGHT') {
    updateParticles(game);
    return;
  }

  game.roundTimer -= deltaTime;

  if (game.roundTimer <= 0) {
    game.roundTimer = 0;

    if (game.player.hp === game.cpu.hp) {
      game.banner = 'DRAW! PRESS SPACE FOR NEXT ROUND';
    } else {
      endRound(game, game.player.hp > game.cpu.hp);
    }

    game.phase = 'ROUND_OVER';
    return;
  }

  updateAI(game);
  updateFighter(game, game.player, game.cpu, true);
  updateFighter(game, game.cpu, game.player, false);
  updateParticles(game);
}

function updateFighter(
  game: GameContext,
  attacker: Fighter,
  defender: Fighter,
  isPlayer: boolean,
): void {
  if (attacker.state !== 'KO') {
    attacker.facing = defender.x > attacker.x ? 1 : -1;
  }

  const isNeutralState =
    attacker.state === 'IDLE' ||
    attacker.state === 'WALK' ||
    attacker.state === 'WALK_BACK' ||
    attacker.state === 'BLOCK' ||
    attacker.state === 'LOW_BLOCK';

  if (isPlayer && isNeutralState) {
    if (game.keys['KeyS'] || game.keys['ArrowDown']) {
      attacker.state = 'LOW_BLOCK';
    } else if (game.keys['KeyW'] || game.keys['ArrowUp']) {
      attacker.state = 'BLOCK';
    } else if (game.keys['KeyA'] || game.keys['ArrowLeft']) {
      attacker.state = attacker.facing === -1 ? 'WALK' : 'WALK_BACK';
      attacker.x -= 1.65;
    } else if (game.keys['KeyD'] || game.keys['ArrowRight']) {
      attacker.state = attacker.facing === 1 ? 'WALK' : 'WALK_BACK';
      attacker.x += 1.65;
    } else {
      attacker.state = 'IDLE';
    }
  }

  if (attacker.state === 'DASH') {
    attacker.x += attacker.facing * 3.4;
  }

  attacker.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, attacker.x));

  if (attacker.dashCooldown > 0) {
    attacker.dashCooldown--;
  }

  if (attacker.timer > 0) {
    attacker.timer--;

    if (attacker.timer === 0 && attacker.state !== 'KO') {
      attacker.state = 'IDLE';
    }
  }

  resolveAttack(game, attacker, defender, isPlayer);
}

function resolveAttack(
  game: GameContext,
  attacker: Fighter,
  defender: Fighter,
  isPlayer: boolean,
): void {
  const punchActive =
    attacker.state === 'PUNCH' &&
    attacker.timer >= 8 &&
    attacker.timer <= 13;

  const kickActive =
    attacker.state === 'KICK' &&
    attacker.timer >= 11 &&
    attacker.timer <= 18;

  const lowKickActive =
    attacker.state === 'LOW_KICK' &&
    attacker.timer >= 13 &&
    attacker.timer <= 20;

  const backKickActive =
    attacker.state === 'BACK_KICK' &&
    attacker.timer >= 10 &&
    attacker.timer <= 17;

  if (!punchActive && !kickActive && !lowKickActive && !backKickActive) {
    return;
  }

  if (attacker.hasHit || defender.state === 'KO') {
    return;
  }

  const reach = punchActive ? 38 : kickActive ? 48 : backKickActive ? 50 : 42;
  const distance = (defender.x - attacker.x) * attacker.facing;

  if (distance <= 10 || distance > reach) {
    return;
  }

  attacker.hasHit = true;

  const isLowAttack = lowKickActive;
  const isBlocked = isLowAttack
    ? defender.state === 'LOW_BLOCK'
    : defender.state === 'BLOCK';

  const impactX = defender.x - defender.facing * 10;
  const impactY = isLowAttack ? 158 : 132;

  if (isBlocked) {
    sfx.block();

    defender.x += attacker.facing * 6;
    defender.hp = Math.max(1, defender.hp - 2);

    spawnHitSparks(game, impactX, impactY, '#FACC15');
    return;
  }

  const damage = punchActive ? 10 : kickActive ? 16 : backKickActive ? 18 : 20;

  sfx.hit();
  game.screenShake = isLowAttack || backKickActive ? 7 : 5;
  game.hitFlash = 4;

  defender.hp = Math.max(0, defender.hp - damage);
  defender.x += attacker.facing * (isLowAttack || backKickActive ? 15 : 12);
  defender.combo = 0;

  attacker.combo++;

  spawnHitSparks(
    game,
    impactX,
    impactY,
    isLowAttack ? '#FB7185' : '#FDE68A',
  );

  if (defender.hp === 0) {
    defender.state = 'KO';
    endRound(game, isPlayer);
    return;
  }

  defender.state = 'STUN';
  defender.timer = isLowAttack ? 18 : 14;
}

function endRound(game: GameContext, playerWon: boolean): void {
  game.phase = 'ROUND_OVER';

  if (playerWon) {
    game.playerWins++;
    game.banner = 'YOU WIN THE ROUND!';
    sfx.win();
  } else {
    game.cpuWins++;
    game.banner = 'CPU WINS THE ROUND!';
    sfx.gong();
  }

  if (
    game.playerWins >= MATCH.roundsToWin ||
    game.cpuWins >= MATCH.roundsToWin
  ) {
    game.phase = 'MATCH_OVER';

    game.banner = game.playerWins > game.cpuWins
      ? 'MATCH WON! PRESS SPACE TO PLAY AGAIN'
      : 'MATCH LOST! PRESS SPACE TO RETRY';
  }
}

function spawnHitSparks(
  game: GameContext,
  x: number,
  y: number,
  color: string,
): void {
  for (let index = 0; index < 12; index++) {
    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.7) * 4,
      life: 12 + Math.floor(Math.random() * 8),
      color,
    };

    game.particles.push(particle);
  }
}

function updateParticles(game: GameContext): void {
  for (let index = game.particles.length - 1; index >= 0; index--) {
    const particle = game.particles[index];

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.18;
    particle.life--;

    if (particle.life <= 0) {
      game.particles.splice(index, 1);
    }
  }
}

function render(game: GameContext): void {
  const context = game.context;

  context.save();

  if (game.screenShake > 0) {
    context.translate(
      Math.round((Math.random() - 0.5) * 4),
      Math.round((Math.random() - 0.5) * 4),
    );

    game.screenShake--;
  }

  drawBackground(context);
  drawFighter(context, game.cpu, game.tick, false);
  drawFighter(context, game.player, game.tick, true);
  drawParticles(game);
  drawHUD(game);

  if (game.hitFlash > 0) {
    context.fillStyle = `rgba(255, 255, 255, ${game.hitFlash * 0.05})`;
    context.fillRect(0, 0, ARENA.width, ARENA.height);

    game.hitFlash--;
  }

  context.restore();
}
