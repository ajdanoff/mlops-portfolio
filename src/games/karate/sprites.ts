import fighterSheetUrl from './assets/fighter.png';

import type {
  SpriteAnimation,
  SpriteSheetSet,
} from './types';

const TOTAL_FRAMES = 13;

const PLAYER_GI_COLOR = {
  red: 247,
  green: 247,
  blue: 242,
};

const CPU_GI_COLOR = {
  red: 56,
  green: 189,
  blue: 248,
};

let cachedSheets: SpriteSheetSet | null = null;
let loadingPromise: Promise<SpriteSheetSet> | null = null;

export function loadFighterSprites(
  animations: Record<string, SpriteAnimation>,
): Promise<SpriteSheetSet> {
  if (cachedSheets) {
    return Promise.resolve(cachedSheets);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = createSpriteSheets(animations)
    .then((sheets) => {
      cachedSheets = sheets;

      return sheets;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

export function getFighterSprites(): SpriteSheetSet | null {
  return cachedSheets;
}

async function createSpriteSheets(
  animations: Record<string, SpriteAnimation>,
): Promise<SpriteSheetSet> {
  const image = await loadImage(
    resolveAssetUrl(fighterSheetUrl),
  );

  const playerCanvas = createCanvasFromImage(image);
  const cpuCanvas = recolorGi(
    playerCanvas,
    PLAYER_GI_COLOR,
    CPU_GI_COLOR,
  );

  return {
    player: playerCanvas,
    cpu: cpuCanvas,
    frameWidth: Math.floor(image.width / TOTAL_FRAMES),
    frameHeight: image.height,
    frameCount: TOTAL_FRAMES,
    animations,
  };
}

function resolveAssetUrl(
  asset: string | { src: string },
): string {
  return typeof asset === 'string'
    ? asset
    : asset.src;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error(`Unable to load sprite sheet: ${src}`));
    };

    image.src = src;
  });
}

function createCanvasFromImage(
  image: HTMLImageElement,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  canvas.width = image.width;
  canvas.height = image.height;

  const context = get2DContext(canvas);

  context.drawImage(image, 0, 0);

  return canvas;
}

function recolorGi(
  source: HTMLCanvasElement,
  from: { red: number; green: number; blue: number },
  to: { red: number; green: number; blue: number },
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  canvas.width = source.width;
  canvas.height = source.height;

  const context = get2DContext(canvas);

  context.drawImage(source, 0, 0);

  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];

    if (alpha === 0) {
      continue;
    }

    if (
      data[index] === from.red &&
      data[index + 1] === from.green &&
      data[index + 2] === from.blue
    ) {
      data[index] = to.red;
      data[index + 1] = to.green;
      data[index + 2] = to.blue;
    }
  }

  context.putImageData(imageData, 0, 0);

  return canvas;
}

function get2DContext(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error('Canvas 2D context is not supported.');
  }

  return context;
}

export function drawSpriteFrame(
  context: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement,
  frameWidth: number,
  frameHeight: number,
  animation: SpriteAnimation,
  animationTime: number,
  destinationX: number,
  destinationY: number,
  facing: 1 | -1,
): void {
  const frameCount = animation.frames.length;

  const frameIndex = animation.loop
    ? Math.floor(animationTime / animation.frameDuration) % frameCount
    : Math.min(
        Math.floor(animationTime / animation.frameDuration),
        frameCount - 1,
      );

  const frame = animation.frames[frameIndex];
  const sourceX = frame * frameWidth;

  context.save();
  context.translate(
    Math.round(destinationX),
    Math.round(destinationY),
  );

  context.scale(facing, 1);

  context.drawImage(
    sheet,
    sourceX,
    0,
    frameWidth,
    frameHeight,
    -Math.floor(frameWidth / 2),
    -frameHeight,
    frameWidth,
    frameHeight,
  );

  context.restore();
}