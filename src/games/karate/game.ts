import type {
  AttackType,
  Fighter,
  GameContext,
  Particle,
} from './types';
import { ARENA, MATCH } from './types';
import {
  ATTACK_DATA,
  canAct,
  createFighter,
  setState,
} from './fighters';
import { updateAI, resetAI } from './ai';
import { sfx } from './audio';
import { loadFighterSprites } from './sprites';
import { FIGHTER_ANIMATIONS } from './fighter-sprites';
import {
  drawBackground,
  drawFighter,
  drawParticles,
  drawHUD,
} from './renderer';
import {
  bindKeyboard,
  bindTouchControls,
  bindUiButtons,
} from './input';

export async function initKarateGame(
  canvas: HTMLCanvasElement,
): Promise<void> {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not supported.');
  }

  context.imageSmoothingEnabled = false;

  const sprites = await loadFighterSprites(
    FIGHTER_ANIMATIONS,
  );

  const game: GameContext = {
    canvas,
    context,
    sprites,
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
      game.phase = 'ROUND_OVER';

      return;
    }

    endRound(game, game.player.hp > game.cpu.hp);

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

  attacker.animationTime++;

  if (isPlayer && canAct(attacker)) {
    handlePlayerMovement(game, attacker);
  }

  if (attacker.state === 'DASH') {
    attacker.x += attacker.facing * 3.4;
  }

  attacker.x = Math.max(
    ARENA.minX,
    Math.min(ARENA.maxX, attacker.x),
  );

  if (attacker.dashCooldown > 0) {
    attacker.dashCooldown--;
  }

  if (attacker.timer > 0) {
    attacker.timer--;

    if (attacker.timer === 0 && attacker.state !== 'KO') {
      setState(attacker, 'IDLE');
    }
  }

  resolveAttack(game, attacker, defender, isPlayer);
}

function handlePlayerMovement(
  game: GameContext,
  player: Fighter,
): void {
  const movingLeft =
    game.keys['KeyA'] || game.keys['ArrowLeft'];

  const movingRight =
    game.keys['KeyD'] || game.keys['ArrowRight'];

  if (game.keys['KeyS'] || game.keys['ArrowDown']) {
    setState(player, 'LOW_BLOCK');

    return;
  }

  if (game.keys['KeyW'] || game.keys['ArrowUp']) {
    setState(player, 'BLOCK');

    return;
  }

  if (movingLeft) {
    setState(
      player,
      player.facing === -1 ? 'WALK' : 'WALK_BACK',
    );

    player.x -= 1.65;

    return;
  }

  if (movingRight) {
    setState(
      player,
      player.facing === 1 ? 'WALK' : 'WALK_BACK',
    );

    player.x += 1.65;

    return;
  }

  setState(player, 'IDLE');
}

function resolveAttack(
  game: GameContext,
  attacker: Fighter,
  defender: Fighter,
  isPlayer: boolean,
): void {
  const attack = getAttackType(attacker.state);

  if (!attack) {
    return;
  }

  const data = ATTACK_DATA[attack];
  const activeStart = data.startup;
  const activeEnd = data.startup + data.active - 1;

  const isActive =
    attacker.timer >= activeStart &&
    attacker.timer <= activeEnd;

  if (!isActive || attacker.hasHit || defender.state === 'KO') {
    return;
  }

  const distance = (defender.x - attacker.x) * attacker.facing;

  if (distance <= 10 || distance > data.reach) {
    return;
  }

  attacker.hasHit = true;

  const impactX = defender.x - defender.facing * 10;
  const impactY = getImpactY(attack);

  if (isBlocked(defender.state, attack)) {
    playBlockSound(defender.state);

    defender.x += attacker.facing * 6;
    defender.hp = Math.max(1, defender.hp - 2);

    spawnHitSparks(
      game,
      impactX,
      impactY,
      '#FACC15',
    );

    return;
  }


  playHitSound(attack);

  game.screenShake = getScreenShake(attack);
  game.hitFlash = 4;

  defender.hp = Math.max(0, defender.hp - data.damage);
  defender.x += attacker.facing * data.knockback;
  defender.combo = 0;

  attacker.combo++;

  const sparkColor =
    attack === 'LOW_KICK'
      ? '#FB7185'
      : attack === 'BACK_KICK'
        ? '#38BDF8'
        : '#FDE68A';

  spawnHitSparks(
    game,
    impactX,
    impactY,
    sparkColor,
  );



  if (defender.hp === 0) {
    setState(defender, 'KO');
    endRound(game, isPlayer);

    return;
  }

  setState(defender, 'STUN');

  defender.timer = getStunDuration(attack);
}

function getAttackType(
  state: Fighter['state'],
): AttackType | null {
  if (
    state === 'PUNCH' ||
    state === 'KICK' ||
    state === 'LOW_KICK' ||
    state === 'BACK_KICK'
  ) {
    return state;
  }

  return null;
}

function isBlocked(
  defenderState: Fighter['state'],
  attack: AttackType,
): boolean {
  if (defenderState === 'BLOCK') {
    return attack === 'PUNCH' || attack === 'KICK';
  }

  if (defenderState === 'MID_BLOCK') {
    return attack === 'KICK' || attack === 'LOW_KICK';
  }

  if (defenderState === 'LOW_BLOCK') {
    return attack === 'LOW_KICK' || attack === 'BACK_KICK';
  }

  return false;
}

function getImpactY(attack: AttackType): number {
  if (attack === 'LOW_KICK') {
    return 158;
  }

  if (attack === 'BACK_KICK') {
    return 146;
  }

  return 132;
}

function getScreenShake(attack: AttackType): number {
  if (attack === 'BACK_KICK') {
    return 8;
  }

  if (attack === 'LOW_KICK') {
    return 7;
  }

  if (attack === 'KICK') {
    return 6;
  }

  return 5;
}

function getStunDuration(attack: AttackType): number {
  if (attack === 'BACK_KICK') {
    return 20;
  }

  if (attack === 'LOW_KICK') {
    return 18;
  }

  if (attack === 'KICK') {
    return 15;
  }

  return 12;
}

function playHitSound(attack: AttackType): void {
  if (attack === 'PUNCH') {
    sfx.punchHit();

    return;
  }

  if (attack === 'KICK') {
    sfx.kickHit();

    return;
  }

  if (attack === 'LOW_KICK') {
    sfx.lowHit();

    return;
  }

  sfx.backHit();
}

function playBlockSound(state: Fighter['state']): void {
  if (state === 'MID_BLOCK') {
    sfx.midBlock();

    return;
  }

  if (state === 'LOW_BLOCK') {
    sfx.lowBlock();

    return;
  }

  sfx.block();
}

function endRound(game: GameContext, playerWon: boolean): void {
  game.phase = 'ROUND_OVER';

  if (playerWon) {
    game.playerWins++;
    game.banner = 'YOU WIN THE ROUND!';
    sfx.roundWin();
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

    if (game.playerWins > game.cpuWins) {
      sfx.matchWin();
    } else {
      sfx.matchLose();
    }
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

  drawFighter(context, game.cpu, game);
  drawFighter(context, game.player, game);

  drawParticles(game);
  drawHUD(game);

  if (game.hitFlash > 0) {
    context.fillStyle = `rgba(255, 255, 255, ${game.hitFlash * 0.05})`;
    context.fillRect(0, 0, ARENA.width, ARENA.height);

    game.hitFlash--;
  }

  context.restore();
}