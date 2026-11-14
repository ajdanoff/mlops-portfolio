import type { Fighter, GameContext } from './types';
import { ARENA } from './types';
import { color } from './palette';
import { getFighterSprites } from './sprites';

export function drawBackground(context: CanvasRenderingContext2D): void {
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

function getFrameIndex(fighter: Fighter, tick: number): number {
  switch (fighter.state) {
    case 'PUNCH':
      return fighter.combo % 2 === 0 ? 0 : 6; // 0: left-hand-kick, 6: right-hand-kick
    case 'BLOCK':
      return Math.floor(tick / 14) % 2 === 0 ? 1 : 11; // 1: upper-block, 11: middle-block
    case 'KICK':
      return 3; // 3: yoko-geri
    case 'LOW_KICK':
      return 4; // 4: kae-mae
    case 'LOW_BLOCK':
      return 5; // 5: lower-block
    case 'STUN':
    case 'KO':
      return 7; // 7: ko
    case 'WALK_BACK':
      return Math.floor(tick / 8) % 2 === 0 ? 8 : 9; // 8: normal-stance, 9: move-back
    case 'WALK':
      return Math.floor(tick / 8) % 2 === 0 ? 8 : 10; // 8: normal-stance, 10: move-forward
    case 'DASH':
      return 10; // 10: move-forward
    case 'BACK_KICK':
      return 12; // 12: back-kick
    case 'IDLE':
    default:
      return Math.floor(tick / 24) % 2 === 0 ? 8 : 2; // 8: normal-stance, 2: stance
  }
}

export function drawFighter(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
  tick: number,
  isPlayer: boolean,
): void {
  context.save();

  const idleBob = fighter.state === 'IDLE'
    ? Math.round(Math.sin(tick * 0.12) * 1)
    : 0;

  const baseY = ARENA.floorY + idleBob;

  context.translate(Math.round(fighter.x), baseY);
  context.scale(fighter.facing, 1);

  drawShadow(context);

  const sheets = getFighterSprites();
  if (sheets) {
    const sheet = isPlayer ? sheets.player : sheets.cpu;
    const frameIdx = getFrameIndex(fighter, tick);

    context.drawImage(
      sheet,
      frameIdx * sheets.frameWidth,
      0,
      sheets.frameWidth,
      sheets.frameHeight,
      -32,
      -62,
      64,
      64,
    );

    context.restore();
    return;
  }

  // Fallback пока грузится PNG
  context.fillStyle = fighter.giColor;
  context.fillRect(-10, -48, 20, 48);
  context.restore();
}

function drawShadow(context: CanvasRenderingContext2D): void {
  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.fillRect(-13, -1, 26, 4);
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

  context.fillStyle = '#38BDF8';
  context.textAlign = 'center';
  context.fillText(`R-${game.round}`, 160, 14);

  const seconds = Math.max(0, Math.ceil(game.roundTimer));

  context.fillStyle = seconds <= 10 ? '#EF4444' : '#F8FAFC';
  context.fillText(`${seconds}s`, 160, 26);

  if (game.player.combo >= 2) {
    context.fillStyle = '#FACC15';
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
  context.fillStyle = '#FFFFFF';
  context.textAlign = align;
  context.fillText(label, align === 'left' ? x : x + 110, 14);

  const width = Math.round((fighter.hp / fighter.maxHp) * 110);
  const barX = align === 'left' ? x : x + (110 - width);

  context.fillStyle = '#1E293B';
  context.fillRect(x, 18, 110, 8);

  context.fillStyle = fighter.hp > 30 ? '#10B981' : '#EF4444';
  context.fillRect(barX, 18, width, 8);

  context.strokeStyle = '#64748B';
  context.strokeRect(x, 18, 110, 8);

  context.textAlign = 'left';
}

function drawBanner(game: GameContext): void {
  const context = game.context;

  context.fillStyle = 'rgba(11, 15, 25, 0.78)';
  context.fillRect(18, 78, 284, 42);

  context.strokeStyle = '#38BDF8';
  context.strokeRect(18, 78, 284, 42);

  context.fillStyle = '#F8FAFC';
  context.font = 'bold 9px monospace';
  context.textAlign = 'center';
  context.fillText(game.banner, 160, 102);

  context.textAlign = 'left';
}
