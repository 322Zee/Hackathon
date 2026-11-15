/**
 * INTERSTELLAR CONTINUUM - Box Collider (AABB)
 * Rectangular collider with customizable offsets and trigger semantics
 */

import { ICollider, ColliderType, CollisionCategory, AABB } from './ColliderTypes';

export interface BoxColliderConfig {
  id?: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  category?: CollisionCategory;
  isTrigger?: boolean;
  enabled?: boolean;
  tag?: string;
  data?: any;
}

export class BoxCollider implements ICollider {
  public readonly id: string;
  public readonly type = ColliderType.BOX;
  public category: CollisionCategory;
  public isTrigger: boolean;
  public enabled: boolean;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public offsetX: number;
  public offsetY: number;
  public tag?: string;
  public data?: any;

  private static idCounter: number = 0;

  constructor(config: BoxColliderConfig) {
    this.id = config.id || `box_col_${++BoxCollider.idCounter}`;
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.width = Math.max(1, config.width);
    this.height = Math.max(1, config.height);
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
    this.category = config.category ?? CollisionCategory.SOLID;
    this.isTrigger = config.isTrigger ?? false;
    this.enabled = config.enabled ?? true;
    this.tag = config.tag;
    this.data = config.data;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getAABB(): AABB {
    const minX = this.x + this.offsetX;
    const minY = this.y + this.offsetY;
    return {
      minX,
      minY,
      maxX: minX + this.width,
      maxY: minY + this.height,
    };
  }

  public containsPoint(px: number, py: number): boolean {
    const aabb = this.getAABB();
    return (
      px >= aabb.minX &&
      px <= aabb.maxX &&
      py >= aabb.minY &&
      py <= aabb.maxY
    );
  }

  public clone(): BoxCollider {
    return new BoxCollider({
      id: `${this.id}_clone`,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
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
