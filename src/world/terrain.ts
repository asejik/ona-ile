/**
 * The ground's height (M4c): a regular grid from the zone file, read the same way the ground mesh is built
 * (each cell split into two triangles along the same diagonal), so anything placed with `heightAt` sits
 * exactly on the drawn ground. Zones without terrain are flat.
 */
import type { ZoneTerrain } from './zone';

export class Terrain {
  constructor(private readonly t: ZoneTerrain | null) {}

  get grid(): ZoneTerrain | null {
    return this.t;
  }

  /** Ground height at world (x, y), in game metres. Outside the grid, the nearest edge. */
  heightAt(x: number, y: number): number {
    const t = this.t;
    if (!t) return 0;
    const fx = Math.min(t.cols - 1.000001, Math.max(0, (x - t.x0) / t.step));
    const fy = Math.min(t.rows - 1.000001, Math.max(0, (y - t.y0) / t.step));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const h = t.h;
    const h00 = h[j * t.cols + i]!;
    const h10 = h[j * t.cols + i + 1]!;
    const h01 = h[(j + 1) * t.cols + i]!;
    const h11 = h[(j + 1) * t.cols + i + 1]!;
    // Two triangles per cell, split from (i, j) to (i + 1, j + 1).
    return tx >= ty ? h00 + tx * (h10 - h00) + ty * (h11 - h10) : h00 + tx * (h11 - h01) + ty * (h01 - h00);
  }

  /** Rise per metre along heading `h` at (x, y): positive uphill. */
  grade(x: number, y: number, h: number): number {
    if (!this.t) return 0;
    const dx = Math.cos(h);
    const dy = Math.sin(h);
    return (this.heightAt(x + dx, y + dy) - this.heightAt(x - dx, y - dy)) / 2;
  }

  /** The ground's unit normal at (x, y), in world axes (x east, y north, z up). */
  normal(x: number, y: number): [number, number, number] {
    if (!this.t) return [0, 0, 1];
    const d = 1.5;
    const gx = (this.heightAt(x + d, y) - this.heightAt(x - d, y)) / (2 * d);
    const gy = (this.heightAt(x, y + d) - this.heightAt(x, y - d)) / (2 * d);
    const l = Math.hypot(gx, gy, 1);
    return [-gx / l, -gy / l, 1 / l];
  }
}
