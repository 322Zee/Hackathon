import { describe, it, expect } from 'vitest';
import { CollisionMath } from '../../src/collision/CollisionMath';
import { BoxCollider } from '../../src/collision/BoxCollider';
import { CircleCollider } from '../../src/collision/CircleCollider';

describe('CollisionMath', () => {
  describe('AABB vs AABB', () => {
    it('detects overlapping bounding boxes', () => {
      const boxA = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      const boxB = { minX: 50, minY: 50, maxX: 150, maxY: 150 };
      expect(CollisionMath.intersectAABB_AABB(boxA, boxB)).toBe(true);
    });

    it('returns false for disjoint bounding boxes', () => {
      const boxA = { minX: 0, minY: 0, maxX: 40, maxY: 40 };
      const boxB = { minX: 50, minY: 50, maxX: 100, maxY: 100 };
      expect(CollisionMath.intersectAABB_AABB(boxA, boxB)).toBe(false);
    });

    it('returns false for edge-touching non-penetrating boxes', () => {
      const boxA = { minX: 0, minY: 0, maxX: 50, maxY: 50 };
      const boxB = { minX: 50, minY: 0, maxX: 100, maxY: 50 };
      expect(CollisionMath.intersectAABB_AABB(boxA, boxB)).toBe(false);
    });
  });

  describe('Circle vs Circle', () => {
    it('detects overlapping circles', () => {
      expect(CollisionMath.intersectCircle_Circle(0, 0, 20, 30, 0, 20)).toBe(true);
    });

    it('returns false for separated circles', () => {
      expect(CollisionMath.intersectCircle_Circle(0, 0, 10, 50, 0, 10)).toBe(false);
    });

    it('returns false for tangent non-overlapping circles', () => {
      expect(CollisionMath.intersectCircle_Circle(0, 0, 10, 20, 0, 10)).toBe(false);
    });
  });

  describe('Circle vs AABB', () => {
    const box = { minX: 100, minY: 100, maxX: 200, maxY: 200 };

    it('detects circle completely inside box', () => {
      expect(CollisionMath.intersectCircle_AABB(150, 150, 15, box)).toBe(true);
    });

    it('detects circle overlapping edge of box', () => {
      expect(CollisionMath.intersectCircle_AABB(90, 150, 15, box)).toBe(true);
    });

    it('detects circle overlapping corner of box', () => {
      // Corner is (100, 100), circle at (90, 90) with radius 15
      // distance from (90, 90) to (100, 100) is sqrt(200) ≈ 14.14 < 15
      expect(CollisionMath.intersectCircle_AABB(90, 90, 15, box)).toBe(true);
    });

    it('returns false for circle outside corner of box', () => {
      // Corner is (100, 100), circle at (85, 85) with radius 15
      // distance from (85, 85) to (100, 100) is sqrt(450) ≈ 21.21 > 15
      expect(CollisionMath.intersectCircle_AABB(85, 85, 15, box)).toBe(false);
    });
  });

  describe('intersectColliders Polymorphism', () => {
    it('checks BoxCollider vs BoxCollider', () => {
      const box1 = new BoxCollider({ x: 0, y: 0, width: 50, height: 50 });
      const box2 = new BoxCollider({ x: 40, y: 40, width: 50, height: 50 });
      expect(CollisionMath.intersectColliders(box1, box2)).toBe(true);
    });

    it('checks CircleCollider vs BoxCollider', () => {
      const circle = new CircleCollider({ x: 45, y: 45, radius: 20 });
      const box = new BoxCollider({ x: 50, y: 50, width: 50, height: 50 });
      expect(CollisionMath.intersectColliders(circle, box)).toBe(true);
    });

    it('checks BoxCollider vs CircleCollider', () => {
      const box = new BoxCollider({ x: 50, y: 50, width: 50, height: 50 });
      const circle = new CircleCollider({ x: 45, y: 45, radius: 20 });
      expect(CollisionMath.intersectColliders(box, circle)).toBe(true);
    });

    it('returns false if either collider is disabled', () => {
      const box1 = new BoxCollider({ x: 0, y: 0, width: 50, height: 50, enabled: false });
      const box2 = new BoxCollider({ x: 10, y: 10, width: 50, height: 50 });
      expect(CollisionMath.intersectColliders(box1, box2)).toBe(false);
    });
  });
});
