/**
 * INTERSTELLAR CONTINUUM - 2D Collision Architecture
 * Collider Types, Categories, and Data Structures
 */

export enum ColliderType {
  BOX = 'BOX',
  CIRCLE = 'CIRCLE',
}

export enum CollisionCategory {
  SOLID = 'SOLID', // Impassable structures, walls, bulkheads
  OBSTACLE = 'OBSTACLE', // Consoles, desks, heavy machinery, crates
  TRIGGER = 'TRIGGER', // Interaction zones, terminals, mission controls
  RESTRICTED = 'RESTRICTED', // Restricted clearance access barriers
  BOUNDARY = 'BOUNDARY', // World map boundary barriers
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ICollider {
  readonly id: string;
  readonly type: ColliderType;
  category: CollisionCategory;
  isTrigger: boolean;
  enabled: boolean;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  tag?: string;
  data?: any;

  /** Set position (usually matches entity world position) */
  setPosition(x: number, y: number): void;

  /** Compute axis-aligned bounding box in world space */
  getAABB(): AABB;

  /** Test if point is inside this collider */
  containsPoint(px: number, py: number): boolean;

  /** Clone or duplicate collider for testing projections */
  clone(): ICollider;
}

export interface MovementResolutionResult {
  x: number;
  y: number;
  collidedX: boolean;
  collidedY: boolean;
  hitColliders: ICollider[];
}
