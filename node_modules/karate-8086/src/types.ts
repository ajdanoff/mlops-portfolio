export type FighterState =
  | 'IDLE'
  | 'WALK'
  | 'WALK_BACK'
  | 'BLOCK'
  | 'MID_BLOCK'
  | 'LOW_BLOCK'
  | 'PUNCH'
  | 'KICK'
  | 'LOW_KICK'
  | 'BACK_KICK'
  | 'DASH'
  | 'STUN'
  | 'KO';

export type AttackType =
  | 'PUNCH'
  | 'KICK'
  | 'LOW_KICK'
  | 'BACK_KICK';

export type BlockType =
  | 'BLOCK'
  | 'MID_BLOCK'
  | 'LOW_BLOCK';

export type GamePhase =
  | 'TITLE'
  | 'FIGHT'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PAUSED';

export interface AttackData {
  duration: number;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  reach: number;
  knockback: number;
}

export interface FighterPalette {
  gi: string;
  giShade: string;
  belt: string;
  headband: string;
  skin: string;
  hair: string;
}

export interface Fighter {
  name: string;
  isPlayer: boolean;
  x: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  state: FighterState;
  timer: number;
  animationTime: number;
  hasHit: boolean;
  dashCooldown: number;
  combo: number;
  palette: FighterPalette;
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
  sprites: SpriteSheetSet;
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

export interface SpriteAnimation {
  frames: number[];
  frameDuration: number;
  loop: boolean;
}

export interface SpriteSheetSet {
  player: HTMLCanvasElement;
  cpu: HTMLCanvasElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  animations: Record<string, SpriteAnimation>;
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