import type { Fighter, GameContext } from './types';
import { ARENA } from './types';

export function drawBackground(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#071329';
  context.fillRect(0, 0, ARENA.width, 60);

  context.fillStyle = '#0C2147';
  context.fillRect(0, 60, ARENA.width, 45);

  context.fillStyle = '#153466';
  context.fillRect(0, 105, ARENA.width, 35);

  context.fillStyle = '#F59E0B';
  context.beginPath();
  context.arc(255, 52, 18, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#0F172A';
  context.beginPath();
  context.moveTo(140, 140);
  context.lineTo(215, 72);
  context.lineTo(235, 72);
  context.lineTo(310, 140);
  context.fill();

  context.fillStyle = '#E2E8F0';
  context.beginPath();
  context.moveTo(197, 88);
  context.lineTo(215, 72);
  context.lineTo(235, 72);
  context.lineTo(252, 88);
  context.lineTo(238, 84);
  context.lineTo(225, 91);
  context.lineTo(212, 84);
  context.fill();

  context.fillStyle = '#7F1D1D';
  context.fillRect(42, 78, 6, 62);
  context.fillRect(88, 78, 6, 62);

  context.fillStyle = '#B91C1C';
  context.fillRect(32, 74, 72, 6);
  context.fillRect(38, 88, 60, 4);

  context.fillStyle = '#1E293B';
  context.fillRect(0, 140, ARENA.width, 60);

  context.fillStyle = '#334155';
  context.fillRect(0, 140, ARENA.width, 3);

  context.fillStyle = '#0F172A';

  for (let x = 0; x <= ARENA.width; x += 32) {
    context.fillRect(x, 143, 2, 57);
  }

  context.fillRect(0, 162, ARENA.width, 2);
  context.fillRect(0, 184, ARENA.width, 2);
}

export function drawFighter(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
  tick: number,
): void {
  context.save();

  const bob = fighter.state === 'IDLE'
    ? Math.floor(Math.sin(tick * 0.15) * 1.5)
    : 0;

  const walkStride = fighter.state === 'WALK'
    ? Math.floor(Math.sin(tick * 0.35) * 4)
    : 0;

  context.translate(Math.round(fighter.x), ARENA.floorY + bob);
  context.scale(fighter.facing, 1);

  context.fillStyle = 'rgba(0, 0, 0, 0.45)';
  context.fillRect(-14, -2, 28, 5);

  if (fighter.state === 'KO') {
    drawKnockedOutFighter(context, fighter);
    context.restore();

    return;
  }

  const torsoShift = fighter.state === 'STUN' ? -4 : 0;

  context.fillStyle = fighter.giShade;
  context.fillRect(-9 - walkStride, -24, 7, 24);

  drawLeg(context, fighter);

  context.fillStyle = fighter.giColor;
  context.fillRect(-10 + torsoShift, -48, 20, 25);

  context.fillStyle = fighter.beltColor;
  context.fillRect(-10 + torsoShift, -28, 20, 4);
  context.fillRect(2 + torsoShift, -24, 4, 7);

  context.fillStyle = '#FDBA74';
  context.fillRect(-6 + torsoShift, -61, 13, 12);

  context.fillStyle = '#0F172A';
  context.fillRect(-7 + torsoShift, -63, 14, 4);

  context.fillStyle = fighter.headband;
  context.fillRect(-7 + torsoShift, -59, 14, 3);
  context.fillRect(-11 + torsoShift, -58, 4, 6);

  drawArms(context, fighter, torsoShift);

  context.restore();
}

function drawLeg(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
): void {
  if (fighter.state === 'KICK') {
    context.fillStyle = fighter.giColor;
    context.fillRect(4, -34, 28, 7);

    context.fillStyle = '#FDBA74';
    context.fillRect(32, -35, 6, 7);

    return;
  }

  if (fighter.state === 'LOW_KICK') {
    context.fillStyle = fighter.giColor;
    context.fillRect(4, -16, 26, 7);

    context.fillStyle = '#FDBA74';
    context.fillRect(30, -17, 6, 7);

    return;
  }

  const stride = fighter.state === 'WALK'
    ? Math.floor(Math.sin(Date.now() * 0.02) * 2)
    : 0;

  context.fillStyle = fighter.giColor;
  context.fillRect(2 + stride, -24, 7, 24);
}

function drawArms(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
  torsoShift: number,
): void {
  if (fighter.state === 'PUNCH') {
    context.fillStyle = fighter.giColor;
    context.fillRect(6, -45, 22, 6);

    context.fillStyle = '#FDBA74';
    context.fillRect(28, -45, 6, 6);

    return;
  }

  if (fighter.state === 'BLOCK') {
    context.fillStyle = fighter.giColor;
    context.fillRect(7, -54, 6, 18);

    context.fillStyle = '#FDBA74';
    context.fillRect(7, -58, 6, 5);

    return;
  }

  if (fighter.state === 'LOW_KICK') {
    context.fillStyle = fighter.giColor;
    context.fillRect(2 + torsoShift, -40, 10, 6);

    return;
  }

  context.fillStyle = fighter.giColor;
  context.fillRect(4 + torsoShift, -44, 10, 6);

  context.fillStyle = '#FDBA74';
  context.fillRect(14 + torsoShift, -45, 5, 5);
}

function drawKnockedOutFighter(
  context: CanvasRenderingContext2D,
  fighter: Fighter,
): void {
  context.fillStyle = fighter.giColor;
  context.fillRect(-24, -10, 36, 10);

  context.fillStyle = fighter.beltColor;
  context.fillRect(-8, -10, 4, 10);

  context.fillStyle = '#FDBA74';
  context.fillRect(12, -10, 10, 9);

  context.fillStyle = fighter.headband;
  context.fillRect(15, -10, 3, 9);
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