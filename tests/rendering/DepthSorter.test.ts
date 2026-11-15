import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { DepthSorter, ISortableEntity } from '../../src/rendering/depth/DepthSorter';

describe('DepthSorter (Dynamic Entity Y-Sorting)', () => {
  it('assigns zIndex to children based on Y coordinate', () => {
    const parent = new Container();
    const child1 = new Container();
    child1.y = 500;
    const child2 = new Container();
    child2.y = 300;
    const child3 = new Container();
    child3.y = 800;

    parent.addChild(child1, child2, child3);

    DepthSorter.sortContainerByY(parent);

    expect(child2.zIndex).toBe(300);
    expect(child1.zIndex).toBe(500);
    expect(child3.zIndex).toBe(800);
    expect(parent.sortableChildren).toBe(true);
  });

  it('sorts entities accounting for depth bias and priority', () => {
    const c1 = new Container();
    const c2 = new Container();

    const entities: ISortableEntity[] = [
      { container: c1, y: 400, depthZ: 1.0 }, // Background entity
      { container: c2, y: 400, depthZ: -1.0 }, // Foreground entity
    ];

    DepthSorter.sortEntities(entities);

    // Foreground entity (negative depthZ) should have higher zIndex than background entity
    expect(c2.zIndex).toBeGreaterThan(c1.zIndex);
  });
});
