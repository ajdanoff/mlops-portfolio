import fighterSheetUrl from './assets/fighter.png';

export interface SpriteSheetSet {
  player: HTMLCanvasElement;
  cpu: HTMLCanvasElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

const TOTAL_FRAMES = 13;
let cachedSheets: SpriteSheetSet | null = null;

export function loadFighterSprites(): void {
  if (cachedSheets) return;

  const img = new Image();
  // В Astro импорт PNG возвращает либо строку URL, либо объект { src: string }
  img.src = typeof fighterSheetUrl === 'string' ? fighterSheetUrl : fighterSheetUrl.src;

  img.onerror = () => {
    console.error('[Karate] Failed to load sprite sheet at:', img.src);
  };

  img.onload = () => {
    const playerCanvas = document.createElement('canvas');
    playerCanvas.width = img.width;
    playerCanvas.height = img.height;
    const pCtx = playerCanvas.getContext('2d');
    if (!pCtx) return;

    pCtx.drawImage(img, 0, 0);
    const imgData = pCtx.getImageData(0, 0, playerCanvas.width, playerCanvas.height);
    const data = imgData.data;

    // Убираем чистый белый фон, если он остался при экспорте
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248) {
        data[i + 3] = 0;
      }
    }
    pCtx.putImageData(imgData, 0, 0);

    // Делаем копию с синим кимоно (#38BDF8) для противника
    const cpuCanvas = document.createElement('canvas');
    cpuCanvas.width = img.width;
    cpuCanvas.height = img.height;
    const cCtx = cpuCanvas.getContext('2d');
    if (!cCtx) return;

    cCtx.drawImage(playerCanvas, 0, 0);
    const cpuData = cCtx.getImageData(0, 0, cpuCanvas.width, cpuCanvas.height);
    const cData = cpuData.data;

    for (let i = 0; i < cData.length; i += 4) {
      if (cData[i + 3] > 0 && cData[i] > 195 && cData[i + 1] > 195 && cData[i + 2] > 195) {
        cData[i] = 56;
        cData[i + 1] = 189;
        cData[i + 2] = 248;
      }
    }
    cCtx.putImageData(cpuData, 0, 0);

    cachedSheets = {
      player: playerCanvas,
      cpu: cpuCanvas,
      frameWidth: Math.floor(img.width / TOTAL_FRAMES),
      frameHeight: img.height,
      frameCount: TOTAL_FRAMES,
    };
  };
}

export function getFighterSprites(): SpriteSheetSet | null {
  return cachedSheets;
}
