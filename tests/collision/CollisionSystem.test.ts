import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { BoxCollider } from '../../src/collision/BoxCollider';
import { CollisionCategory } from '../../src/collision/ColliderTypes';
import { EventBus } from '../../src/core/EventBus';

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    collisionSystem = new CollisionSystem({ eventBus });
    collisionSystem.initialize();
  });

  it('registers, retrieves, and removes colliders', () => {
    const box = new BoxCollider({ id: 'box_1', x: 100, y: 100, width: 50, height: 50 });
    collisionSystem.addCollider(box);

    expect(collisionSystem.getCollider('box_1')).toBe(box);
    expect(collisionSystem.getAllColliders()).toContain(box);

    collisionSystem.removeCollider('box_1');
    expect(collisionSystem.getCollider('box_1')).toBeUndefined();
  });

  describe('Sliding Collision Resolution (Independent Axis Testing)', () => {
    it('allows unimpeded movement when no obstacles are in path', () => {
      const moving = new BoxCollider({
        id: 'player',
        x: 100,
        y: 100,
        width: 30,
        height: 20,
        offsetX: -15,
        offsetY: -10,
      });
      collisionSystem.addCollider(moving);

      const res = collisionSystem.resolveMovement(100, 100, 10, 15, moving);
      expect(res.collidedX).toBe(false);
      expect(res.collidedY).toBe(false);
      expect(res.x).toBe(110);
      expect(res.y).toBe(115);
    });

    it('stops X movement and clamps to obstacle edge while allowing free Y sliding', () => {
      const moving = new BoxCollider({
        id: 'player',
        x: 100,
        y: 100,
        width: 30,
        height: 20,
        offsetX: -15,
        offsetY: -10,
      });
      collisionSystem.addCollider(moving);

      // Solid vertical wall placed at X=130..150, Y=50..200
      const wall = new BoxCollider({
        id: 'wall_right',
        x: 130,
        y: 50,
        width: 20,
        height: 150,
        category: CollisionCategory.SOLID,
      });
      collisionSystem.addCollider(wall);

      // Player attempts to move diagonally right-down: deltaX = 30, deltaY = 20
      // Right edge of player at start is 100 + 15 = 115. Moving right by 30 would put right edge at 145 > 130!
      // X should clamp right edge to 130 (centerX = 130 - 15 = 115)
      // Y should slide unimpeded: 100 + 20 = 120
      const res = collisionSystem.resolveMovement(100, 100, 30, 20, moving);

      expect(res.collidedX).toBe(true);
      expect(res.collidedY).toBe(false);
      expect(res.x).toBe(115); // Clamped against wall left edge
      expect(res.y).toBe(120); // Free sliding along Y axis!
    });

    it('stops Y movement and clamps to obstacle edge while allowing free X sliding', () => {
      const moving = new BoxCollider({
        id: 'player',
        x: 100,
        y: 100,
        width: 30,
        height: 20,
        offsetX: -15,
        offsetY: -10,
      });
      collisionSystem.addCollider(moving);

      // Solid horizontal wall at X=50..200, Y=120..140
      const wall = new BoxCollider({
        id: 'wall_bottom',
        x: 50,
        y: 120,
        width: 150,
        height: 20,
        category: CollisionCategory.SOLID,
      });
      collisionSystem.addCollider(wall);

      // Player attempts to move diagonally right-down: deltaX = 25, deltaY = 30
      // Bottom edge of player at start is 100 + 10 = 110. Moving down by 30 would put bottom at 140 > 120!
      // Y should clamp bottom edge to 120 (centerY = 120 - 10 = 110)
      // X should slide unimpeded: 100 + 25 = 125
      const res = collisionSystem.resolveMovement(100, 100, 25, 30, moving);

      expect(res.collidedX).toBe(false);
      expect(res.collidedY).toBe(true);
      expect(res.x).toBe(125); // Free sliding along X axis!
      expect(res.y).toBe(110); // Clamped against wall top edge
    });

    it('clamps both axes when hitting an interior corner', () => {
      const moving = new BoxCollider({
        id: 'player',
        x: 100,
        y: 100,
        width: 20,
        height: 20,
        offsetX: -10,
        offsetY: -10,
      });
      collisionSystem.addCollider(moving);

      // Corner formed by wallRight at X=120 and wallBottom at Y=120
      collisionSystem.addCollider(
        new BoxCollider({ id: 'wall_right', x: 120, y: 50, width: 50, height: 100 })
      );
      collisionSystem.addCollider(
        new BoxCollider({ id: 'wall_bottom', x: 50, y: 120, width: 120, height: 50 })
      );

      const res = collisionSystem.resolveMovement(100, 100, 40, 40, moving);
      expect(res.collidedX).toBe(true);
      expect(res.collidedY).toBe(true);
      expect(res.x).toBe(110); // 120 - 10
      expect(res.y).toBe(110); // 120 - 10
    });
  });

  describe('Triggers and Overlaps', () => {
    it('does not impede movement through trigger colliders', () => {
      const moving = new BoxCollider({ id: 'player', x: 100, y: 100, width: 20, height: 20 });
      collisionSystem.addCollider(moving);

      const trigger = new BoxCollider({
        id: 'portal',
        x: 105,
        y: 105,
        width: 50,
        height: 50,
        isTrigger: true,
        category: CollisionCategory.TRIGGER,
      });
      collisionSystem.addCollider(trigger);

      const res = collisionSystem.resolveMovement(100, 100, 20, 20, moving);
      expect(res.collidedX).toBe(false);
      expect(res.collidedY).toBe(false);
      expect(res.x).toBe(120);
      expect(res.y).toBe(120);
    });

    it('emits collision:trigger-enter and collision:trigger-exit events on EventBus', () => {
      let enterTrigger: any = null;
      let exitTrigger: any = null;

      eventBus.on('collision:trigger-enter', (payload: any) => {
        enterTrigger = payload.trigger;
      });
      eventBus.on('collision:trigger-exit', (payload: any) => {
        exitTrigger = payload.trigger;
      });

      const moving = new BoxCollider({ id: 'player', x: 50, y: 50, width: 20, height: 20 });
      collisionSystem.addCollider(moving);

      const trigger = new BoxCollider({
        id: 'term_1',
        x: 90,
        y: 50,
        width: 30,
        height: 30,
        isTrigger: true,
        category: CollisionCategory.TRIGGER,
      });
      collisionSystem.addCollider(trigger);

      // Move into trigger: from 50 to 95
      collisionSystem.resolveMovement(50, 50, 45, 0, moving);
      expect(enterTrigger).not.toBeNull();
      expect(enterTrigger.id).toBe('term_1');

      // Move out of trigger: from 95 to 160
      collisionSystem.resolveMovement(95, 50, 65, 0, moving);
      expect(exitTrigger).not.toBeNull();
      expect(exitTrigger.id).toBe('term_1');
    });

    it('queries overlapping colliders with checkOverlaps', () => {
      const player = new BoxCollider({ id: 'player', x: 100, y: 100, width: 40, height: 40 });
      const triggerA = new BoxCollider({ id: 't_a', x: 110, y: 110, width: 30, height: 30, isTrigger: true });
      const triggerB = new BoxCollider({ id: 't_b', x: 500, y: 500, width: 30, height: 30, isTrigger: true });

      collisionSystem.addCollider(player);
      collisionSystem.addCollider(triggerA);
      collisionSystem.addCollider(triggerB);

      const overlaps = collisionSystem.checkOverlaps(player);
      expect(overlaps).toContain(triggerA);
      expect(overlaps).not.toContain(triggerB);
    });
  });

  describe('Debug Visualization', () => {
    it('toggles debug state cleanly', () => {
      expect(collisionSystem.isDebugEnabled()).toBe(false);
      collisionSystem.setDebugEnabled(true);
      expect(collisionSystem.isDebugEnabled()).toBe(true);
      collisionSystem.setDebugEnabled(false);
      expect(collisionSystem.isDebugEnabled()).toBe(false);
    });
  });
});
