/**
 * INTERSTELLAR CONTINUUM - Collision Math & Intersection Algorithms
 * Fast, pure 2D geometric intersection tests
 */

import { AABB, ICollider, ColliderType } from './ColliderTypes';
import { CircleCollider } from './CircleCollider';

export class CollisionMath {
  /**
   * Test intersection between two Axis-Aligned Bounding Boxes
   */
  public static intersectAABB_AABB(a: AABB, b: AABB): boolean {
    return (
      a.minX < b.maxX &&
      a.maxX > b.minX &&
      a.minY < b.maxY &&
      a.maxY > b.minY
    );
  }

  /**
   * Test intersection between two Circles
   */
  public static intersectCircle_Circle(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const radiusSum = r1 + r2;
    return dx * dx + dy * dy < radiusSum * radiusSum;
  }

  /**
   * Test intersection between a Circle and an AABB
   */
  public static intersectCircle_AABB(
    cx: number,
    cy: number,
    radius: number,
    box: AABB
  ): boolean {
    // Find closest point on AABB to circle center
    const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
    const closestY = Math.max(box.minY, Math.min(cy, box.maxY));

    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  /**
   * General intersection between any two IColliders
   */
  public static intersectColliders(a: ICollider, b: ICollider): boolean {
    if (!a.enabled || !b.enabled) return false;

    // Fast broadphase AABB rejection
    if (!this.intersectAABB_AABB(a.getAABB(), b.getAABB())) {
      return false;
    }

    if (a.type === ColliderType.BOX && b.type === ColliderType.BOX) {
      return this.intersectAABB_AABB(a.getAABB(), b.getAABB());
    }

    if (a.type === ColliderType.CIRCLE && b.type === ColliderType.CIRCLE) {
      const cA = a as CircleCollider;
      const cB = b as CircleCollider;
      return this.intersectCircle_Circle(
        cA.centerWorldX,
        cA.centerWorldY,
        cA.radius,
        cB.centerWorldX,
        cB.centerWorldY,
        cB.radius
      );
    }

    if (a.type === ColliderType.CIRCLE && b.type === ColliderType.BOX) {
      const c = a as CircleCollider;
      return this.intersectCircle_AABB(
        c.centerWorldX,
        c.centerWorldY,
        c.radius,
        b.getAABB()
      );
    }

    if (a.type === ColliderType.BOX && b.type === ColliderType.CIRCLE) {
      const c = b as CircleCollider;
      return this.intersectCircle_AABB(
        c.centerWorldX,
        c.centerWorldY,
        c.radius,
        a.getAABB()
      );
    }

    return false;
  }
}
