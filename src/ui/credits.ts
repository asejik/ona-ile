/**
 * The credits card (DESIGN §6, "Credits" on the title card): map data, heights, fonts and the engine,
 * with their licences, and the game's version. Esc or Done closes it and focus goes back.
 */
export interface CreditsCard {
  readonly open: boolean;
  show(): void;
  close(): void;
}

export function createCredits(root: HTMLElement, version: string): CreditsCard {
  const done = root.querySelector<HTMLButtonElement>('#creditsDone')!;
  root.querySelector('#creditsVersion')!.textContent = `Version ${version}`;
  let restoreFocus: Element | null = null;
  const card: CreditsCard = {
    get open() {
      return !root.hidden;
    },
    show() {
      restoreFocus = document.activeElement;
      root.hidden = false;
      done.focus({ preventScroll: true });
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      if (restoreFocus instanceof HTMLElement) restoreFocus.focus({ preventScroll: true });
    },
  };
  done.addEventListener('click', () => card.close());
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      card.close();
      e.stopPropagation();
    } else if (e.key === 'Tab') {
      // Keep focus inside the card.
      const items = [...root.querySelectorAll<HTMLElement>('a, button')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
    }
  });
  return card;
}
