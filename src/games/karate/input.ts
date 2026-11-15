import type { GameContext } from './types';
import { triggerAttack, tryDash } from './fighters';
import { resetMatch, startOrContinue } from './game';
import { toggleMute, unlockAudio } from './audio';

const BLOCKED_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
] as const;

const START_KEYS = [
  'Space',
  'Enter',
  'KeyJ',
  'KeyK',
  'KeyL',
  'KeyB',
  'KeyZ',
  'KeyX',
  'KeyC',
  'KeyV',
] as const;

interface ActionBinding {
  codes: string[];
  action: (game: GameContext) => void;
}

const ACTION_BINDINGS: ActionBinding[] = [
  {
    codes: ['KeyJ', 'KeyZ'],
    action: (game) => triggerAttack(game.player, 'PUNCH'),
  },
  {
    codes: ['KeyK', 'KeyX'],
    action: (game) => triggerAttack(game.player, 'KICK'),
  },
  {
    codes: ['KeyL', 'KeyC'],
    action: (game) => triggerAttack(game.player, 'LOW_KICK'),
  },
  {
    codes: ['KeyB', 'KeyV'],
    action: (game) => triggerAttack(game.player, 'BACK_KICK'),
  },
  {
    codes: ['ShiftLeft', 'ShiftRight'],
    action: (game) => tryDash(game.player),
  },
];

export function bindKeyboard(game: GameContext): void {
  window.addEventListener('keydown', (event) => {
    unlockAudio();

    if ((BLOCKED_KEYS as readonly string[]).includes(event.code)) {
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
      if ((START_KEYS as readonly string[]).includes(event.code)) {
        startOrContinue(game);
      }

      return;
    }

    handleActionInput(game, event.code);
  });

  window.addEventListener('keyup', (event) => {
    game.keys[event.code] = false;
  });

  window.addEventListener('blur', () => {
    clearKeys(game);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearKeys(game);
    }
  });
}

export function bindTouchControls(game: GameContext): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    '.touch-btn',
  );

  buttons.forEach((button) => {
    const code = button.dataset.key ?? '';

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      unlockAudio();

      button.setPointerCapture(event.pointerId);

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

      handleActionInput(game, code);
    });

    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      game.keys[code] = false;
    });

    button.addEventListener('pointercancel', () => {
      game.keys[code] = false;
    });

    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  });
}

export function bindUiButtons(game: GameContext): void {
  document
    .getElementById('reset-btn')
    ?.addEventListener('click', () => {
      unlockAudio();
      resetMatch(game);
    });

  document
    .getElementById('pause-btn')
    ?.addEventListener('click', () => {
      unlockAudio();
      togglePause(game);
    });

  document
    .getElementById('mute-btn')
    ?.addEventListener('click', (event) => {
      unlockAudio();

      const button = event.currentTarget as HTMLButtonElement | null;

      if (!button) {
        return;
      }

      const muted = toggleMute();

      button.textContent = `PC Speaker: ${muted ? 'OFF' : 'ON'}`;
    });
}

function handleActionInput(
  game: GameContext,
  code: string,
): void {
  const binding = ACTION_BINDINGS.find((item) =>
    item.codes.includes(code),
  );

  binding?.action(game);
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

function clearKeys(game: GameContext): void {
  for (const code of Object.keys(game.keys)) {
    game.keys[code] = false;
  }
}