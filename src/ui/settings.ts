/**
 * The settings card (DESIGN §6): controls, swipe steering, text size, graphics, reduce motion, sound and
 * the save code.
 * Each choice is a group of buttons with aria-pressed. Focus stays inside the card and Esc closes it.
 */
import { decodeSaveCode, encodeSaveCode } from '../platform/save';
import type { Settings } from '../platform/settings';
import type { GameState } from '../sim/rides';
import { naira } from '../story/content';

export interface SettingsDeps {
  settings: Settings;
  /** Called after any change, with the settings already updated. */
  changed(): void;
  game(): GameState;
  pageCount: number;
  /** Replaces the game with an imported one. */
  load(state: GameState): void;
  /** Whether motion is reduced now: the player's choice, or the device's when they haven't chosen. */
  reducedMotion(): boolean;
  /** Restarts the game so a new graphics setting takes effect (progress is already saved). */
  restart(): void;
}

export interface SettingsPanel {
  readonly open: boolean;
  show(onClose?: () => void): void;
  close(): void;
}

export function createSettingsPanel(root: HTMLElement, d: SettingsDeps): SettingsPanel {
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const card = q('.card');
  const codeEl = q('#saveCode');
  const input = q<HTMLInputElement>('#importCode');
  const msg = q('#importMsg');
  const confirm = q('#importConfirm');
  let onClose: (() => void) | undefined;
  let restoreFocus: Element | null = null;
  let pending: GameState | null = null;

  const gfxRestart = q('#gfxRestart');
  /** The graphics setting the game was started with, to tell whether a restart is needed. */
  let startedWith = d.settings.graphics;
  const value = (key: string): string => {
    const s = d.settings;
    if (key === 'sound') return s.sound ? 'on' : 'off';
    if (key === 'reduceMotion') return d.reducedMotion() ? 'on' : 'off';
    if (key === 'textSize') return s.textSize;
    if (key === 'graphics') return s.graphics;
    return key === 'controls' ? s.controls : s.steer;
  };
  const sync = () => {
    for (const g of root.querySelectorAll<HTMLElement>('[data-setting]')) {
      for (const b of g.querySelectorAll<HTMLButtonElement>('button')) {
        b.setAttribute('aria-pressed', String(b.dataset.value === value(g.dataset.setting!)));
      }
    }
  };

  for (const g of root.querySelectorAll<HTMLElement>('[data-setting]')) {
    g.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-value]');
      if (!b) return;
      const v = b.dataset.value!;
      const s = d.settings;
      const key = g.dataset.setting;
      if (key === 'sound') s.sound = v === 'on';
      else if (key === 'reduceMotion') s.reduceMotion = v === 'on';
      else if (key === 'textSize') s.textSize = v as Settings['textSize'];
      else if (key === 'graphics') s.graphics = v as Settings['graphics'];
      else if (key === 'controls') s.controls = v as Settings['controls'];
      else s.steer = v as Settings['steer'];
      gfxRestart.hidden = s.graphics === startedWith;
      sync();
      d.changed();
    });
  }

  const resetImport = () => {
    pending = null;
    confirm.hidden = true;
    msg.textContent = '';
    msg.classList.remove('bad');
  };

  q('#copyCode').addEventListener('click', () => {
    const code = codeEl.textContent ?? '';
    const done = () => (msg.textContent = 'Copied. Paste it on the other device.');
    void navigator.clipboard?.writeText(code).then(done, () => {
      // No clipboard permission: select the code so the player can copy it by hand.
      const range = document.createRange();
      range.selectNodeContents(codeEl);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      msg.textContent = 'Select the code and copy it.';
    });
  });

  q('#importBtn').addEventListener('click', () => {
    resetImport();
    const state = decodeSaveCode(input.value, d.pageCount);
    if (!state) {
      msg.textContent = "That save code isn't valid";
      msg.classList.add('bad');
      return;
    }
    pending = state;
    const places = state.pages.filter(Boolean).length;
    q('#importSummary').textContent =
      `This code has ${naira(state.money)}, ${state.rides} rides and ${places} of ${state.pages.length} notebook places. ` +
      'It replaces the progress on this device.';
    confirm.hidden = false;
    q('#importYes').focus({ preventScroll: true });
  });
  q('#importYes').addEventListener('click', () => {
    if (!pending) return;
    d.load(pending);
    input.value = '';
    resetImport();
    codeEl.textContent = encodeSaveCode(d.game());
    msg.textContent = 'Progress loaded.';
    // The confirm buttons just hid, so give focus somewhere it can stay.
    q('#importBtn').focus({ preventScroll: true });
  });
  q('#importNo').addEventListener('click', resetImport);
  q('#gfxRestartBtn').addEventListener('click', () => {
    startedWith = d.settings.graphics;
    d.restart();
  });

  const panel: SettingsPanel = {
    get open() {
      return !root.hidden;
    },
    show(cb) {
      onClose = cb;
      restoreFocus = document.activeElement;
      sync();
      resetImport();
      input.value = '';
      codeEl.textContent = encodeSaveCode(d.game());
      root.hidden = false;
      card.scrollTop = 0;
      q('#settingsDone').focus({ preventScroll: true });
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      if (restoreFocus instanceof HTMLElement) restoreFocus.focus({ preventScroll: true });
      onClose?.();
    },
  };
  q('#settingsDone').addEventListener('click', () => panel.close());

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      panel.close();
      e.stopPropagation();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...card.querySelectorAll<HTMLElement>('button, input')].filter(
      (el) => el.offsetParent !== null,
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last?.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first?.focus();
      e.preventDefault();
    }
  });
  return panel;
}
