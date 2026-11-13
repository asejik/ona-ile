/**
 * The notebook-page dialogue card (DESIGN.md §6) and toasts.
 * Opening a card moves focus to its first button and keeps it inside; closing returns it (A-10).
 */
import type { Who } from '../story/content';

export interface DialogButton {
  label: string;
  /** 'primary' (keke yellow), 'cta' (green, one per screen) or 'outline'. */
  kind?: 'primary' | 'cta' | 'outline';
  onClick?: () => void;
}

export interface DialogContent {
  who: Who;
  text: string;
  /** Rows for the detail table: [label, value]. A row marked total is bold. */
  rows?: { label: string; value: string; total?: boolean }[];
  /** Star rating 1–5, shown as icons with the count in words. */
  stars?: number;
  note?: string;
  buttons: DialogButton[];
}

export interface Dialogs {
  readonly open: boolean;
  show(content: DialogContent): void;
  /** Shows cards one after another, then calls done. */
  chain(lines: { who: Who; text: string }[], done?: () => void): void;
  toast(text: string, kind?: 'good' | 'bad' | '', ms?: number, who?: string): void;
}

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

export function createDialogs(overlay: HTMLElement, toasts: HTMLElement): Dialogs {
  let isOpen = false;
  let restoreFocus: Element | null = null;

  const el = (tag: string, cls?: string, text?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const close = () => {
    isOpen = false;
    overlay.hidden = true;
    overlay.replaceChildren();
    if (restoreFocus instanceof HTMLElement) restoreFocus.focus({ preventScroll: true });
  };

  const api: Dialogs = {
    get open() {
      return isOpen;
    },
    show(c) {
      restoreFocus = document.activeElement;
      isOpen = true;
      const card = el('div', 'card dialog-card');
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-labelledby', 'dlgName');
      const who = el('div', 'who');
      const face = el('div', 'face', c.who.initial);
      face.style.background = c.who.colour;
      face.setAttribute('aria-hidden', 'true');
      const names = el('div');
      const nm = el('div', 'nm', c.who.name);
      nm.id = 'dlgName';
      names.append(nm, el('div', 'rl', c.who.role));
      who.append(face, names);
      card.append(who, el('p', 'say', c.text));
      if (c.stars) {
        const stars = el('div', 'stars');
        stars.setAttribute('aria-label', `${c.stars} of 5 stars`);
        for (let i = 0; i < 5; i++) {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('aria-hidden', 'true');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', STAR_PATH);
          if (i >= c.stars) svg.classList.add('off');
          svg.append(path);
          stars.append(svg);
        }
        stars.append(el('span', 'stars-text', `${c.stars} of 5 stars`));
        card.append(stars);
      }
      if (c.rows?.length) {
        const table = el('table', 'rows');
        for (const r of c.rows) {
          const tr = el('tr', r.total ? 'total' : '');
          tr.append(el('td', '', r.label), el('td', '', r.value));
          table.append(tr);
        }
        card.append(table);
      }
      if (c.note) card.append(el('p', 'note', c.note));
      const btns = el('div', 'btns');
      const buttons = c.buttons.map((b) => {
        const button = el('button', `btn${b.kind && b.kind !== 'primary' ? ` ${b.kind}` : ''}`, b.label);
        button.addEventListener('click', () => {
          close();
          b.onClick?.();
        });
        return button;
      });
      btns.append(...buttons);
      card.append(btns);
      // Keep keyboard focus inside the card.
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || buttons.length < 2) return;
        const first = buttons[0]!;
        const last = buttons[buttons.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      });
      overlay.replaceChildren(card);
      overlay.hidden = false;
      // Keyboard players land on the first button (A-10); on touch screens the ring would only be noise.
      if (!window.matchMedia('(pointer: coarse)').matches) buttons[0]?.focus({ preventScroll: true });
    },
    chain(lines, done) {
      const next = (i: number) => {
        const line = lines[i];
        if (!line) return done?.();
        api.show({
          who: line.who,
          text: line.text,
          buttons: [{ label: i < lines.length - 1 ? 'Next' : 'OK', onClick: () => next(i + 1) }],
        });
      };
      next(0);
    },
    toast(text, kind = '', ms = 2600, who) {
      while (toasts.children.length >= 2) toasts.firstChild?.remove();
      const t = el('div', `toast ${kind}`);
      if (who) t.append(el('b', '', `${who}: `));
      t.append(document.createTextNode(text));
      toasts.append(t);
      setTimeout(() => t.remove(), ms);
    },
  };
  return api;
}
