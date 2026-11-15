/**
 * INTERSTELLAR CONTINUUM - Spatial Hash Grid
 * Broadphase collision optimization for fast spatial queries
 */

import { ICollider, AABB } from './ColliderTypes';

export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, Set<ICollider>> = new Map();
  private colliderToCells: Map<string, Set<string>> = new Map();

  constructor(cellSize: number = 128) {
    this.cellSize = Math.max(32, cellSize);
  }

  private cellKey(cellX: number, cellY: number): string {
    return `${cellX},${cellY}`;
  }

  private getCellCoords(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: Math.floor(x / this.cellSize),
      cy: Math.floor(y / this.cellSize),
    };
  }

  public insert(collider: ICollider): void {
    const aabb = collider.getAABB();
    const min = this.getCellCoords(aabb.minX, aabb.minY);
    const max = this.getCellCoords(aabb.maxX, aabb.maxY);

    let cellKeys = this.colliderToCells.get(collider.id);
    if (!cellKeys) {
      cellKeys = new Set();
      this.colliderToCells.set(collider.id, cellKeys);
    }

    for (let cx = min.cx; cx <= max.cx; cx++) {
      for (let cy = min.cy; cy <= max.cy; cy++) {
        const key = this.cellKey(cx, cy);
        cellKeys.add(key);

        let bucket = this.grid.get(key);
        if (!bucket) {
          bucket = new Set();
          this.grid.set(key, bucket);
        }
        bucket.add(collider);
      }
    }
  }

  public remove(collider: ICollider): void {
    const cellKeys = this.colliderToCells.get(collider.id);
    if (!cellKeys) return;

    for (const key of cellKeys) {
      const bucket = this.grid.get(key);
      if (bucket) {
        bucket.delete(collider);
        if (bucket.size === 0) {
          this.grid.delete(key);
        }
      }
    }

    this.colliderToCells.delete(collider.id);
  }

  public update(collider: ICollider): void {
    this.remove(collider);
    this.insert(collider);
  }

  public queryAABB(aabb: AABB): ICollider[] {
    const min = this.getCellCoords(aabb.minX, aabb.minY);
    const max = this.getCellCoords(aabb.maxX, aabb.maxY);
    const result = new Set<ICollider>();

    for (let cx = min.cx; cx <= max.cx; cx++) {
      for (let cy = min.cy; cy <= max.cy; cy++) {
        const key = this.cellKey(cx, cy);
        const bucket = this.grid.get(key);
        if (bucket) {
          for (const col of bucket) {
            result.add(col);
          }
        }
      }
    }

    return Array.from(result);
  }

  public clear(): void {
    this.grid.clear();
    this.colliderToCells.clear();
  }
}
