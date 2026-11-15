/**
 * INTERSTELLAR CONTINUUM - Central 2D Collision System
 * Sliding resolution, trigger tracking, spatial hashing, and debug visualization
 */

import { Container, Graphics } from 'pixi.js';
import { IGameSystem, SystemId } from '../systems/interfaces/IGameSystem';
import { ICollisionSystem } from '../systems/interfaces/CoreSystemInterfaces';
import {
  ICollider,
  ColliderType,
  CollisionCategory,
  MovementResolutionResult,
} from './ColliderTypes';
import { BoxCollider } from './BoxCollider';
import { CircleCollider } from './CircleCollider';
import { CollisionMath } from './CollisionMath';
import { SpatialHashGrid } from './SpatialHashGrid';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';

export interface CollisionSystemConfig {
  spatialCellSize?: number;
  eventBus?: EventBus;
}

export class CollisionSystem implements ICollisionSystem, IGameSystem {
  public readonly id = SystemId.COLLISION;
  public readonly priority = 11; // Runs right after input (10), before camera (12) and rendering (15)

  private colliders: Map<string, ICollider> = new Map();
  private spatialGrid: SpatialHashGrid;
  private eventBus?: EventBus;
  private debugEnabled: boolean = false;
  private debugGraphics?: Graphics;
  private activeOverlapsByEntity: Map<string, Set<string>> = new Map(); // entityId -> Set of triggerIds

  constructor(config?: CollisionSystemConfig) {
    this.spatialGrid = new SpatialHashGrid(config?.spatialCellSize ?? 128);
    this.eventBus = config?.eventBus;
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  public initialize(): void {
    Logger.info('COLLISION_SYSTEM', 'Collision System initialized.');
  }

  public update(_deltaSeconds: number): void {
    // If debug is active and container attached, re-render debug visuals
    if (this.debugEnabled && this.debugGraphics) {
      this.drawDebugOverlay();
    }
  }

  public shutdown(): void {
    this.clear();
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = undefined;
    }
    Logger.info('COLLISION_SYSTEM', 'Collision System shut down.');
  }

  public addCollider(collider: ICollider): void {
    this.colliders.set(collider.id, collider);
    this.spatialGrid.insert(collider);
  }

  public removeCollider(colliderId: string): void {
    const collider = this.colliders.get(colliderId);
    if (collider) {
      this.spatialGrid.remove(collider);
      this.colliders.delete(colliderId);
    }
  }

  public getCollider(colliderId: string): ICollider | undefined {
    return this.colliders.get(colliderId);
  }

  public getAllColliders(): ICollider[] {
    return Array.from(this.colliders.values());
  }

  public updateColliderPosition(colliderId: string, x: number, y: number): void {
    const collider = this.colliders.get(colliderId);
    if (collider) {
      collider.setPosition(x, y);
      this.spatialGrid.update(collider);
    }
  }

  /**
   * Independent Axis Sliding Movement Resolution:
   * Moves on X axis first, tests and clamps; moves on Y axis second, tests and clamps.
   * Guarantees smooth sliding along walls and corner obstacles.
   */
  public resolveMovement(
    currentX: number,
    currentY: number,
    deltaX: number,
    deltaY: number,
    collider: ICollider
  ): MovementResolutionResult {
    let resolvedX = currentX;
    let resolvedY = currentY;
    let collidedX = false;
    let collidedY = false;
    const hitColliders: ICollider[] = [];

    // Temporary working copy of collider for testing positions
    const testCollider = collider.clone();

    // 1. Resolve X AXIS
    if (deltaX !== 0) {
      let candidateX = currentX + deltaX;
      testCollider.setPosition(candidateX, currentY);

      const nearby = this.spatialGrid.queryAABB(testCollider.getAABB());
      for (const obstacle of nearby) {
        if (!obstacle.enabled || obstacle.id === collider.id || obstacle.isTrigger) {
          continue;
        }

        if (CollisionMath.intersectColliders(testCollider, obstacle)) {
          collidedX = true;
          hitColliders.push(obstacle);

          // Clamp candidateX based on direction of travel
          const obsAABB = obstacle.getAABB();
          if (collider.type === ColliderType.BOX) {
            const box = collider as BoxCollider;
            if (deltaX > 0) {
              // Moving Right: right edge cannot exceed obstacle minX
              candidateX = obsAABB.minX - box.offsetX - box.width;
            } else {
              // Moving Left: left edge cannot go below obstacle maxX
              candidateX = obsAABB.maxX - box.offsetX;
            }
          } else if (collider.type === ColliderType.CIRCLE) {
            const circle = collider as CircleCollider;
            if (deltaX > 0) {
              candidateX = obsAABB.minX - circle.offsetX - circle.radius;
            } else {
              candidateX = obsAABB.maxX - circle.offsetX + circle.radius;
            }
          }

          // Update test collider to clamped position and continue checking remaining obstacles
          testCollider.setPosition(candidateX, currentY);
        }
      }
      resolvedX = candidateX;
    }

    // 2. Resolve Y AXIS (using the newly resolved X position)
    if (deltaY !== 0) {
      let candidateY = currentY + deltaY;
      testCollider.setPosition(resolvedX, candidateY);

      const nearby = this.spatialGrid.queryAABB(testCollider.getAABB());
      for (const obstacle of nearby) {
        if (!obstacle.enabled || obstacle.id === collider.id || obstacle.isTrigger) {
          continue;
        }

        if (CollisionMath.intersectColliders(testCollider, obstacle)) {
          collidedY = true;
          if (!hitColliders.includes(obstacle)) {
            hitColliders.push(obstacle);
          }

          // Clamp candidateY based on direction of travel
          const obsAABB = obstacle.getAABB();
          if (collider.type === ColliderType.BOX) {
            const box = collider as BoxCollider;
            if (deltaY > 0) {
              // Moving Down: bottom edge cannot exceed obstacle minY
              candidateY = obsAABB.minY - box.offsetY - box.height;
            } else {
              // Moving Up: top edge cannot go below obstacle maxY
              candidateY = obsAABB.maxY - box.offsetY;
            }
          } else if (collider.type === ColliderType.CIRCLE) {
            const circle = collider as CircleCollider;
            if (deltaY > 0) {
              candidateY = obsAABB.minY - circle.offsetY - circle.radius;
            } else {
              candidateY = obsAABB.maxY - circle.offsetY + circle.radius;
            }
          }

          testCollider.setPosition(resolvedX, candidateY);
        }
      }
      resolvedY = candidateY;
    }

    // 3. Update collider to final resolved position
    collider.setPosition(resolvedX, resolvedY);
    this.spatialGrid.update(collider);

    // 4. Update Trigger Overlaps and emit events
    this.updateTriggerOverlaps(collider);

    return {
      x: resolvedX,
      y: resolvedY,
      collidedX,
      collidedY,
      hitColliders,
    };
  }

  /**
   * Check all currently overlapping triggers for the given collider
   */
  public checkOverlaps(collider: ICollider): ICollider[] {
    const nearby = this.spatialGrid.queryAABB(collider.getAABB());
    const overlaps: ICollider[] = [];

    for (const other of nearby) {
      if (!other.enabled || other.id === collider.id) continue;
      if (CollisionMath.intersectColliders(collider, other)) {
        overlaps.push(other);
      }
    }

    return overlaps;
  }

  /**
   * Internal tracker for trigger enter / trigger exit events
   */
  private updateTriggerOverlaps(entityCollider: ICollider): void {
    const currentOverlaps = this.checkOverlaps(entityCollider).filter((c) => c.isTrigger);
    const currentOverlapIds = new Set(currentOverlaps.map((c) => c.id));

    let previousOverlapIds = this.activeOverlapsByEntity.get(entityCollider.id);
    if (!previousOverlapIds) {
      previousOverlapIds = new Set();
      this.activeOverlapsByEntity.set(entityCollider.id, previousOverlapIds);
    }

    // Check newly entered triggers
    for (const trigger of currentOverlaps) {
      if (!previousOverlapIds.has(trigger.id)) {
        previousOverlapIds.add(trigger.id);
        if (this.eventBus) {
          this.eventBus.emit('collision:trigger-enter', {
            entityId: entityCollider.id,
            entityCollider,
            trigger,
          });
        }
      }
    }

    // Check exited triggers
    for (const prevId of previousOverlapIds) {
      if (!currentOverlapIds.has(prevId)) {
        previousOverlapIds.delete(prevId);
        const trigger = this.colliders.get(prevId);
        if (trigger && this.eventBus) {
          this.eventBus.emit('collision:trigger-exit', {
            entityId: entityCollider.id,
            entityCollider,
            trigger,
          });
        }
      }
    }
  }

  // ==================== DEBUG VISUALIZATION ====================

  public setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    if (this.debugGraphics) {
      this.debugGraphics.visible = enabled;
      if (enabled) {
        this.drawDebugOverlay();
      } else {
        this.debugGraphics.clear();
      }
    }
  }

  public isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  public attachDebugContainer(parent: Container): Graphics {
    if (!this.debugGraphics) {
      this.debugGraphics = new Graphics();
      this.debugGraphics.zIndex = 99999;
    }
    parent.addChild(this.debugGraphics);
    this.debugGraphics.visible = this.debugEnabled;
    return this.debugGraphics;
  }

  public drawDebugOverlay(): void {
    if (!this.debugGraphics) return;
    this.debugGraphics.clear();

    for (const collider of this.colliders.values()) {
      if (!collider.enabled) continue;

      let color = 0xff3344; // Default SOLID red
      let alpha = 0.15;

      switch (collider.category) {
        case CollisionCategory.SOLID:
          color = 0xff3344; // Red
          alpha = 0.2;
          break;
        case CollisionCategory.OBSTACLE:
          color = 0xffaa22; // Orange
          alpha = 0.2;
          break;
        case CollisionCategory.TRIGGER:
          color = 0x22ee88; // Neon Green
          alpha = 0.25;
          break;
        case CollisionCategory.RESTRICTED:
          color = 0x00ccff; // Cyan
          alpha = 0.25;
          break;
        case CollisionCategory.BOUNDARY:
          color = 0xffdd33; // Yellow
          alpha = 0.2;
          break;
      }

      if (collider.type === ColliderType.BOX) {
        const box = collider as BoxCollider;
        const aabb = box.getAABB();
        const w = aabb.maxX - aabb.minX;
        const h = aabb.maxY - aabb.minY;

        this.debugGraphics
          .rect(aabb.minX, aabb.minY, w, h)
          .fill({ color, alpha })
          .stroke({ color, width: 2, alpha: 0.9 });
      } else if (collider.type === ColliderType.CIRCLE) {
        const circle = collider as CircleCollider;
        this.debugGraphics
          .circle(circle.centerWorldX, circle.centerWorldY, circle.radius)
          .fill({ color, alpha })
          .stroke({ color, width: 2, alpha: 0.9 });
      }
    }
  }

  public clear(): void {
    this.colliders.clear();
    this.spatialGrid.clear();
    this.activeOverlapsByEntity.clear();
    if (this.debugGraphics) {
      this.debugGraphics.clear();
    }
  }
}
