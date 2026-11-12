export type FighterState =
  | 'IDLE'
  | 'WALK'
  | 'BLOCK'
  | 'PUNCH'
  | 'KICK'
  | 'LOW_KICK'
  | 'DASH'
  | 'STUN'
  | 'KO';

export type GamePhase =
  | 'TITLE'
  | 'FIGHT'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PAUSED';

export interface Fighter {
  name: string;
  x: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  state: FighterState;
  timer: number;
  hasHit: boolean;
  dashCooldown: number;
  combo: number;
  giColor: string;
  giShade: string;
  beltColor: string;
  headband: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface GameContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  player: Fighter;
  cpu: Fighter;
  particles: Particle[];
  keys: Record<string, boolean>;
  phase: GamePhase;
  banner: string;
  round: number;
  playerWins: number;
  cpuWins: number;
  roundTimer: number;
  screenShake: number;
  hitFlash: number;
  tick: number;
}

export const ARENA = {
  width: 320,
  height: 200,
  floorY: 168,
  minX: 28,
  maxX: 292,
} as const;

export const MATCH = {
  roundsToWin: 2,
  roundTime: 60,
} as const;