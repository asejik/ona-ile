/**
 * "Today's page": the mission tracker (HUD-1). A notebook to-do list in the top-left corner showing
 * what the driver is doing now: the ride, the stage goal and the notebook. Finished lines are struck
 * through (DESIGN.md §2, signature moment 1).
 */
import { comfortWord } from '../sim/rides';
import { naira } from '../story/content';

export interface TrackerState {
  ride:
    | { kind: 'find'; nearestM: number | null }
    | { kind: 'ride'; pax: string; dest: string; metres: number; secondsLeft: number; comfort: number }
    | { kind: 'challenge'; dest: string; metres: number; secondsLeft: number; countdown: number };
  money: number;
  goal: number;
  pagesFound: number;
  pagesTotal: number;
  respect: number;
}

export interface Tracker {
  update(s: TrackerState): void;
}

const time = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export function createTracker(root: HTMLElement): Tracker {
  root.innerHTML = `
    <p class="eyebrow">Today's page</p>
    <ul class="todo">
      <li data-line="ride"><span class="box" aria-hidden="true"></span><span class="text"></span></li>
      <li data-line="goal"><span class="box" aria-hidden="true"></span><span class="text"></span></li>
      <li data-line="pages"><span class="box" aria-hidden="true"></span><span class="text"></span></li>
    </ul>
    <div class="comfort" hidden>
      <span class="comfort-label">Comfort</span>
      <span class="bar"><i></i></span>
      <span class="comfort-word"></span>
    </div>
    <p class="respect"></p>`;
  const line = (k: string) => root.querySelector<HTMLElement>(`[data-line="${k}"]`)!;
  const text = (k: string) => line(k).querySelector<HTMLElement>('.text')!;
  const comfort = root.querySelector<HTMLElement>('.comfort')!;
  const fill = comfort.querySelector<HTMLElement>('i')!;
  const word = comfort.querySelector<HTMLElement>('.comfort-word')!;
  const respect = root.querySelector<HTMLElement>('.respect')!;
  let last = '';

  return {
    update(s) {
      const key = JSON.stringify(s);
      if (key === last) return;
      last = key;
      if (s.ride.kind === 'find') {
        text('ride').textContent =
          s.ride.nearestM === null
            ? 'Find a passenger (₦ sign)'
            : `Find a passenger: nearest ${Math.round(s.ride.nearestM / 10) * 10} m`;
        line('ride').classList.remove('urgent');
        comfort.hidden = true;
      } else if (s.ride.kind === 'challenge') {
        // TIME-1: the clock counts down to the bronze time.
        text('ride').textContent =
          s.ride.countdown > 0
            ? `Challenge: to ${s.ride.dest} · starting in ${Math.ceil(s.ride.countdown)}`
            : `Challenge: to ${s.ride.dest} · ${Math.round(s.ride.metres)} m · ${time(s.ride.secondsLeft)}`;
        line('ride').classList.toggle('urgent', s.ride.countdown === 0 && s.ride.secondsLeft < 15);
        comfort.hidden = true;
      } else {
        const late = s.ride.secondsLeft < 0;
        text('ride').textContent = `Take ${s.ride.pax} to ${s.ride.dest} · ${Math.round(s.ride.metres)} m · ${
          late ? 'late' : time(s.ride.secondsLeft)
        }`;
        line('ride').classList.toggle('urgent', late);
        comfort.hidden = false;
        fill.style.transform = `scaleX(${Math.max(0, Math.min(100, s.ride.comfort)) / 100})`;
        word.textContent = comfortWord(s.ride.comfort);
      }
      const goalDone = s.money >= s.goal;
      text('goal').textContent = goalDone
        ? `Mama's medicine paid (${naira(s.goal)})`
        : `Mama's medicine: ${naira(s.money)} of ${naira(s.goal)}`;
      line('goal').classList.toggle('done', goalDone);
      const pagesDone = s.pagesFound >= s.pagesTotal;
      text('pages').textContent = `Baba's notebook: ${s.pagesFound} of ${s.pagesTotal} places`;
      line('pages').classList.toggle('done', pagesDone);
      respect.textContent = `Respect ${s.respect}`;
    },
  };
}
