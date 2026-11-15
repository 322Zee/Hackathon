/**
 * INTERSTELLAR CONTINUUM - Circle Collider
 * Radial collider with customizable offsets and trigger semantics
 */

import { ICollider, ColliderType, CollisionCategory, AABB } from './ColliderTypes';

export interface CircleColliderConfig {
  id?: string;
  x?: number;
  y?: number;
  radius: number;
  offsetX?: number;
  offsetY?: number;
  category?: CollisionCategory;
  isTrigger?: boolean;
  enabled?: boolean;
  tag?: string;
  data?: any;
}

export class CircleCollider implements ICollider {
  public readonly id: string;
  public readonly type = ColliderType.CIRCLE;
  public category: CollisionCategory;
  public isTrigger: boolean;
  public enabled: boolean;
  public x: number;
  public y: number;
  public radius: number;
  public offsetX: number;
  public offsetY: number;
  public tag?: string;
  public data?: any;

  private static idCounter: number = 0;

  constructor(config: CircleColliderConfig) {
    this.id = config.id || `circle_col_${++CircleCollider.idCounter}`;
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.radius = Math.max(1, config.radius);
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
    this.category = config.category ?? CollisionCategory.SOLID;
    this.isTrigger = config.isTrigger ?? false;
    this.enabled = config.enabled ?? true;
    this.tag = config.tag;
    this.data = config.data;
  }

  public get centerWorldX(): number {
    return this.x + this.offsetX;
  }

  public get centerWorldY(): number {
    return this.y + this.offsetY;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getAABB(): AABB {
    const cx = this.centerWorldX;
    const cy = this.centerWorldY;
    return {
      minX: cx - this.radius,
      minY: cy - this.radius,
      maxX: cx + this.radius,
      maxY: cy + this.radius,
    };
  }

  public containsPoint(px: number, py: number): boolean {
    const dx = px - this.centerWorldX;
    const dy = py - this.centerWorldY;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  public clone(): CircleCollider {
    return new CircleCollider({
      id: `${this.id}_clone`,
      x: this.x,
      y: this.y,
      radius: this.radius,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      category: this.category,
      isTrigger: this.isTrigger,
      enabled: this.enabled,
      tag: this.tag,
      data: this.data,
    });
  }
}
