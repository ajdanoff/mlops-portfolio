import type { GameContext } from './types';
import { triggerAttack, tryDash } from './fighters';
import { resetMatch, startOrContinue } from './game';

const BLOCKED_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
];

const START_KEYS = [
  'Space',
  'Enter',
  'KeyJ',
  'KeyK',
  'KeyL',
  'KeyZ',
  'KeyX',
  'KeyC',
];

export function bindKeyboard(game: GameContext): void {
  window.addEventListener('keydown', (event) => {
    if (BLOCKED_KEYS.includes(event.code)) {
      event.preventDefault();
    }

    game.keys[event.code] = true;

    if (event.code === 'KeyR') {
      resetMatch(game);

      return;
    }

    if (event.code === 'KeyP' || event.code === 'Escape') {
      togglePause(game);

      return;
    }

    if (game.phase !== 'FIGHT') {
      if (START_KEYS.includes(event.code)) {
        startOrContinue(game);
      }

      return;
    }

    if (event.code === 'KeyJ' || event.code === 'KeyZ') {
      triggerAttack(game.player, 'PUNCH');
    }

    if (event.code === 'KeyK' || event.code === 'KeyX') {
      triggerAttack(game.player, 'KICK');
    }

    if (event.code === 'KeyL' || event.code === 'KeyC') {
      triggerAttack(game.player, 'LOW_KICK');
    }

    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      tryDash(game.player);
    }
  });

  window.addEventListener('keyup', (event) => {
    game.keys[event.code] = false;
  });
}

export function bindTouchControls(game: GameContext): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.touch-btn');

  buttons.forEach((button) => {
    const code = button.dataset.key ?? '';

    button.addEventListener('touchstart', (event) => {
      event.preventDefault();
      game.keys[code] = true;

      if (code === 'KeyR') {
        resetMatch(game);

        return;
      }

      if (code === 'KeyP') {
        togglePause(game);

        return;
      }

      if (game.phase !== 'FIGHT') {
        startOrContinue(game);

        return;
      }

      if (code === 'KeyJ') {
        triggerAttack(game.player, 'PUNCH');
      }

      if (code === 'KeyK') {
        triggerAttack(game.player, 'KICK');
      }

      if (code === 'KeyL') {
        triggerAttack(game.player, 'LOW_KICK');
      }

      if (code === 'ShiftLeft') {
        tryDash(game.player);
      }
    });

    button.addEventListener('touchend', (event) => {
      event.preventDefault();
      game.keys[code] = false;
    });
  });
}

export function bindUiButtons(game: GameContext): void {
  document
    .getElementById('reset-btn')
    ?.addEventListener('click', () => resetMatch(game));

  document
    .getElementById('pause-btn')
    ?.addEventListener('click', () => togglePause(game));

  document
    .getElementById('mute-btn')
    ?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement | null;

      if (!button) {
        return;
      }

      const muted = toggleMuteState();

      button.textContent = `PC Speaker: ${muted ? 'OFF' : 'ON'}`;
    });
}

function togglePause(game: GameContext): void {
  if (game.phase === 'FIGHT') {
    game.phase = 'PAUSED';
    game.banner = 'PAUSED - PRESS P TO RESUME';

    return;
  }

  if (game.phase === 'PAUSED') {
    game.phase = 'FIGHT';
    game.banner = '';
  }
}

async function toggleMuteState(): Promise<boolean> {
  const { toggleMute } = await import('./audio');

  return toggleMute();
}