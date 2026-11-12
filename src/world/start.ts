import type { RoadNetwork } from './roads';
import type { Zone } from './zone';

/** Where the player starts: on the road nearest the first spot, facing along it. */
export function startPose(zone: Zone, roads: RoadNetwork): { x: number; y: number; h: number } {
  const spot = zone.spots[0] ?? { x: 0, y: 0 };
  let best = Infinity;
  let pose = { x: spot.x, y: spot.y, h: 0 };
  for (const s of roads.segments) {
    const ex = s.bx - s.ax;
    const ey = s.by - s.ay;
    const t = Math.min(1, Math.max(0, ((spot.x - s.ax) * ex + (spot.y - s.ay) * ey) / (ex * ex + ey * ey)));
    const px = s.ax + t * ex;
    const py = s.ay + t * ey;
    const d = Math.hypot(spot.x - px, spot.y - py);
    if (d < best && s.hw >= 3) {
      best = d;
      pose = { x: px, y: py, h: Math.atan2(ey, ex) };
    }
  }
  return pose;
}
