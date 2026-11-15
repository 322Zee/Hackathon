/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Depth Sorter for 2.5D Gameplay Objects
 * Performs fast Y-sorting and Z-ordering on dynamic gameplay containers
 */

import { Container } from 'pixi.js';

export interface ISortableEntity {
  container: Container;
  y: number;
  depthZ?: number; // Optional 2.5D depth offset
  sortPriority?: number; // Manual override priority
}

export class DepthSorter {
  /**
   * Sorts children of a PixiJS container based on their Y position.
   * Leverages PixiJS's built-in zIndex + sortableChildren for zero-allocation sorting.
   */
  public static sortContainerByY(parent: Container, yOffsetFactor: number = 1.0): void {
    parent.sortableChildren = true;
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Container;
      if (child) {
        // Quantize Y position to zIndex integer space
        const targetZ = Math.floor(child.y * yOffsetFactor);
        if (child.zIndex !== targetZ) {
          child.zIndex = targetZ;
        }
      }
    }
  }

  /**
   * Sorts a list of sortable entities taking both Y-coordinate and 2.5D Z-depth into account
   */
  public static sortEntities(entities: ISortableEntity[]): void {
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]!;
      const depthBias = (entity.depthZ ?? 0) * 1000;
      const priorityBias = (entity.sortPriority ?? 0) * 10000;
      const computedZ = Math.floor(priorityBias - depthBias + entity.y);

      if (entity.container.zIndex !== computedZ) {
        entity.container.zIndex = computedZ;
      }
    }
  }
}
