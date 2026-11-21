/**
 * Keeps the top of the HUD readable at every text size (ACC-2). Larger text makes Today's page taller,
 * and the warden chip and the street banner, placed for normal text, would land on it. Each element is
 * pushed down, if needed, until it clears every visible element listed before it.
 */
const GAP = 6;

const overlaps = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom + GAP && b.top < a.bottom;

/** `order`: the elements from the top down; earlier ones stay put, later ones move clear of them. */
export function stackHud(order: HTMLElement[]): void {
  const placed: DOMRect[] = [];
  for (const el of order) {
    el.style.marginTop = '';
    if (el.hidden || el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    // Moving below one element can land on another, so keep going until it clears them all.
    let top = r.top;
    for (let moved = true, guard = 0; moved && guard < placed.length + 1; guard++) {
      moved = false;
      const at = new DOMRect(r.left, top, r.width, r.height);
      for (const p of placed) {
        if (overlaps(at, p)) {
          top = p.bottom + GAP;
          moved = true;
          break;
        }
      }
    }
    if (top > r.top) el.style.marginTop = `${top - r.top}px`;
    placed.push(new DOMRect(r.left, top, r.width, r.height));
  }
}
