import type {
  Fighter,
  GameContext,
} from './types';
import { ARENA } from './types';
import {
  color,
  effectColor,
  uiColor,
} from './palette';
import { FIGHTER_ANIMATIONS } from './fighter-sprites';
import { drawSpriteFrame } from './sprites';

export function drawBackground(
  context: CanvasRenderingContext2D,
): void {
  drawSky(context);
  drawMoon(context);
  drawMountains(context);
  drawToriiGate(context);
  drawFloor(context);
}

function drawSky(context: CanvasRenderingContext2D): void {
  context.fillStyle = color('black');
  context.fillRect(0, 0, ARENA.width, 34);

  context.fillStyle = color('darkBlue');
  context.fillRect(0, 34, ARENA.width, 38);

  context.fillStyle = color('blue');
  context.fillRect(0, 72, ARENA.width, 32);

  context.fillStyle = color('lightBlue');
  context.fillRect(0, 104, ARENA.width, 36);
}

function drawMoon(context: CanvasRenderingContext2D): void {
  context.fillStyle = color('yellow');
  context.beginPath();
  context.arc(258, 44, 16, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = color('orange');
  context.beginPath();
  context.arc(258, 44, 16, Math.PI * 0.15, Math.PI * 0.85);
  context.fill();
}

function drawMountains(context: CanvasRenderingContext2D): void {
  context.fillStyle = color('darkBlue');
  context.beginPath();
  context.moveTo(0, 140);
  context.lineTo(52, 96);
  context.lineTo(104, 140);
  context.fill();

  context.fillStyle = color('blue');
  context.beginPath();
  context.moveTo(126, 140);
  context.lineTo(216, 66);
  context.lineTo(306, 140);
  context.fill();

  context.fillStyle = color('white');
  context.beginPath();
  context.moveTo(196, 86);
  context.lineTo(216, 66);
  context.lineTo(238, 86);
  context.lineTo(228, 82);
  context.lineTo(216, 90);
  context.lineTo(204, 82);
  context.fill();
}

function drawToriiGate(context: CanvasRenderingContext2D): void {
  context.fillStyle = color('darkRed');
  context.fillRect(40, 76, 7, 64);
  context.fillRect(90, 76, 7, 64);

  context.fillStyle = color('red');
  context.fillRect(28, 70, 82, 7);
  context.fillRect(34, 86, 70, 4);

  context.fillStyle = color('black');
  context.fillRect(28, 77, 82, 2);
}

function drawFloor(context: CanvasRenderingContext2D): void {
  context.fillStyle = color('darkGray');
  context.fillRect(0, 140, ARENA.width, 60);

  context.fillStyle = color('gray');
  context.fillRect(0, 140, ARENA.width, 3);

  context.fillStyle = color('black');

  for (let x = 0; x <= ARENA.width; x += 24) {
    context.fillRect(x, 143, 1, 57);
  }

  context.fillRect(0, 163, ARENA.width, 1);
  context.fillRect(0, 181, ARENA.width, 1);

  context.fillStyle = color('darkGreen');
  context.fillRect(0, 138, ARENA.width, 2);
}

export function drawFighter(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
  game: GameContext,
): void {
  const sheet = fighter.isPlayer
    ? game.sprites.player
    : game.sprites.cpu;

  const animation = FIGHTER_ANIMATIONS[fighter.state] ??
    FIGHTER_ANIMATIONS.IDLE;

  const bob = fighter.state === 'IDLE'
    ? Math.round(Math.sin(fighter.animationTime * 0.12))
    : 0;

  const baseY = ARENA.floorY + bob;

  drawShadow(context, fighter.x, baseY);

  //const animation = FIGHTER_ANIMATIONS[fighter.state] ??
  //FIGHTER_ANIMATIONS.IDLE;
  
  drawSpriteFrame(
    context,
    sheet,
    game.sprites.frameWidth,
    game.sprites.frameHeight,
    animation,
    fighter.animationTime,
    fighter.x,
    baseY,
    fighter.facing,
  );
}

function drawShadow(
  context: CanvasRenderingContext2D,
  x: number,
  baseY: number,
): void {
  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.fillRect(
    Math.round(x) - 13,
    baseY - 1,
    26,
    4,
  );
}

export function drawParticles(game: GameContext): void {
  for (const particle of game.particles) {
    game.context.fillStyle = particle.color;
    game.context.fillRect(
      Math.round(particle.x),
      Math.round(particle.y),
      2,
      2,
    );
  }
}

export function drawHUD(game: GameContext): void {
  const context = game.context;

  context.font = 'bold 8px monospace';

  drawHealthBar(
    context,
    game.player,
    12,
    `${game.player.name} [${game.playerWins}]`,
    'left',
  );

  drawHealthBar(
    context,
    game.cpu,
    198,
    `[${game.cpuWins}] ${game.cpu.name}`,
    'right',
  );

  context.fillStyle = uiColor('primary');
  context.textAlign = 'center';
  context.fillText(`R-${game.round}`, 160, 14);

  const seconds = Math.max(0, Math.ceil(game.roundTimer));

  context.fillStyle = seconds <= 10
    ? uiColor('danger')
    : uiColor('text');

  context.fillText(`${seconds}s`, 160, 26);

  if (game.player.combo >= 2) {
    context.fillStyle = uiColor('warning');
    context.fillText(`${game.player.combo} HIT COMBO`, 160, 42);
  }

  context.textAlign = 'left';

  if (game.phase !== 'FIGHT') {
    drawBanner(game);
  }
}

function drawHealthBar(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
  x: number,
  label: string,
  align: 'left' | 'right',
): void {
  context.fillStyle = uiColor('text');
  context.textAlign = align;
  context.fillText(label, align === 'left' ? x : x + 110, 14);

  const width = Math.round((fighter.hp / fighter.maxHp) * 110);
  const barX = align === 'left' ? x : x + (110 - width);

  context.fillStyle = color('darkGray');
  context.fillRect(x, 18, 110, 8);

  context.fillStyle = fighter.hp > 30
    ? uiColor('success')
    : uiColor('danger');

  context.fillRect(barX, 18, width, 8);

  context.strokeStyle = color('gray');
  context.strokeRect(x, 18, 110, 8);

  context.textAlign = 'left';
}

function drawBanner(game: GameContext): void {
  const context = game.context;

  context.fillStyle = 'rgba(5, 6, 10, 0.78)';
  context.fillRect(18, 78, 284, 42);

  context.strokeStyle = uiColor('primary');
  context.strokeRect(18, 78, 284, 42);

  context.fillStyle = uiColor('text');
  context.font = 'bold 9px monospace';
  context.textAlign = 'center';
  context.fillText(game.banner, 160, 102);

  context.textAlign = 'left';
}