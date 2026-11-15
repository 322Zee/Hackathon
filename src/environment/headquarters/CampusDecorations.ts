/**
 * INTERSTELLAR CONTINUUM - Headquarters Campus Environmental Decorations
 * Outdoor props, streetlights, landscaped trees, DSN dishes, launch umbilical tower, and ground support equipment
 */

import { Container, Graphics } from 'pixi.js';
import { BoxCollider } from '../../collision/BoxCollider';
import { CircleCollider } from '../../collision/CircleCollider';
import { CollisionCategory, ICollider } from '../../collision/ColliderTypes';
import { CAMPUS_WIDTH, CAMPUS_HEIGHT } from './CampusTypes';

export class CampusDecorations {
  public readonly container: Container;
  public readonly colliders: ICollider[] = [];

  constructor() {
    this.container = new Container();
    this.container.label = 'CampusDecorations';
    this.container.sortableChildren = true;

    this.buildPerimeterFences();
    this.buildTrees();
    this.buildStreetlights();
    this.buildBenchesAndSignage();
    this.buildGroundSupportEquipment();
    this.buildTrackingDishes();
    this.buildLaunchPadInfrastructure();
  }

  // ---------------------------------------------------------------------------
  // 1. PERIMETER SECURITY FENCES
  // ---------------------------------------------------------------------------
  private buildPerimeterFences(): void {
    const fenceGfx = new Graphics();
    this.container.addChild(fenceGfx);

    const fenceColor = 0x334155;
    const postColor = 0x64748b;

    // Outer Boundary Fences (with wide road access gap on the West at Arrival Gate)
    // North Boundary (Full width)
    this.drawFenceSegment(fenceGfx, 60, 60, CAMPUS_WIDTH - 60, 60, fenceColor, postColor);
    this.addFenceCollider(60, 50, CAMPUS_WIDTH - 120, 20, 'FENCE_NORTH');

    // South Boundary (Full width)
    this.drawFenceSegment(fenceGfx, 60, CAMPUS_HEIGHT - 60, CAMPUS_WIDTH - 60, CAMPUS_HEIGHT - 60, fenceColor, postColor);
    this.addFenceCollider(60, CAMPUS_HEIGHT - 70, CAMPUS_WIDTH - 120, 20, 'FENCE_SOUTH');

    // East Boundary (Full height)
    this.drawFenceSegment(fenceGfx, CAMPUS_WIDTH - 60, 60, CAMPUS_WIDTH - 60, CAMPUS_HEIGHT - 60, fenceColor, postColor);
    this.addFenceCollider(CAMPUS_WIDTH - 70, 60, 20, CAMPUS_HEIGHT - 120, 'FENCE_EAST');

    // West Boundary Upper (Above Arrival Gate: y = 60 to 1100)
    this.drawFenceSegment(fenceGfx, 60, 60, 60, 1100, fenceColor, postColor);
    this.addFenceCollider(50, 60, 20, 1040, 'FENCE_WEST_UPPER');

    // West Boundary Lower (Below Arrival Gate: y = 1500 to 2340)
    this.drawFenceSegment(fenceGfx, 60, 1500, 60, CAMPUS_HEIGHT - 60, fenceColor, postColor);
    this.addFenceCollider(50, 1500, 20, CAMPUS_HEIGHT - 1560, 'FENCE_WEST_LOWER');

    // Launch Complex Security Fence (Enclosing Pad Alpha with double-gate access from Road at x = 2800)
    this.drawFenceSegment(fenceGfx, 2550, 1520, 2800, 1520, 0xd97706, 0xf59e0b);
    this.addFenceCollider(2550, 1510, 250, 20, 'FENCE_PAD_NORTH_A');

    this.drawFenceSegment(fenceGfx, 2900, 1520, 3500, 1520, 0xd97706, 0xf59e0b);
    this.addFenceCollider(2900, 1510, 600, 20, 'FENCE_PAD_NORTH_B');
  }

  private drawFenceSegment(
    gfx: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    wireColor: number,
    postColor: number
  ): void {
    gfx.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: wireColor, width: 3 });

    // Fence posts every 40px
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const count = Math.max(1, Math.floor(dist / 40));
    for (let i = 0; i <= count; i++) {
      const px = x1 + (x2 - x1) * (i / count);
      const py = y1 + (y2 - y1) * (i / count);
      gfx.rect(px - 3, py - 3, 6, 6).fill({ color: postColor });
    }
  }

  private addFenceCollider(x: number, y: number, w: number, h: number, id: string): void {
    const col = new BoxCollider({
      id: `col_${id}`,
      x,
      y,
      width: w,
      height: h,
      category: CollisionCategory.SOLID,
      tag: 'BOUNDARY_FENCE',
    });
    this.colliders.push(col);
  }

  // ---------------------------------------------------------------------------
  // 2. LANDSCAPED CAMPUS TREES
  // ---------------------------------------------------------------------------
  private buildTrees(): void {
    // Strategic tree clusters along boulevards and plaza perimeters
    const treePositions = [
      // Central Plaza Ring
      { x: 1620, y: 1040, r: 28 },
      { x: 1980, y: 1040, r: 28 },
      { x: 1620, y: 1360, r: 28 },
      { x: 1980, y: 1360, r: 28 },
      // North Boulevard Avenue
      { x: 1720, y: 720, r: 24 },
      { x: 1880, y: 720, r: 24 },
      { x: 1720, y: 880, r: 24 },
      { x: 1880, y: 880, r: 24 },
      // West Lawn Park (between Admin & Arrival)
      { x: 780, y: 1050, r: 32 },
      { x: 860, y: 1120, r: 30 },
      { x: 740, y: 1200, r: 34 },
      { x: 920, y: 1280, r: 28 },
      // South MOC Front Lawn
      { x: 1550, y: 1680, r: 26 },
      { x: 2050, y: 1680, r: 26 },
      // East VAB Buffer Green
      { x: 2480, y: 920, r: 30 },
      { x: 2480, y: 1180, r: 30 },
    ];

    for (let i = 0; i < treePositions.length; i++) {
      const pos = treePositions[i]!;
      const treeContainer = new Container();
      treeContainer.zIndex = pos.y + 10;

      const gfx = new Graphics();
      // Drop shadow on ground
      gfx
        .ellipse(pos.x, pos.y + 12, pos.r * 1.1, pos.r * 0.45)
        .fill({ color: 0x07110c, alpha: 0.45 });

      // Trunk
      gfx.circle(pos.x, pos.y, 6).fill({ color: 0x3d2716 });

      // Layered Canopy Foliage
      gfx
        .circle(pos.x, pos.y - 12, pos.r)
        .fill({ color: 0x1b4329 })
        .circle(pos.x - 4, pos.y - 16, pos.r * 0.8)
        .fill({ color: 0x225534 })
        .circle(pos.x + 3, pos.y - 20, pos.r * 0.55)
        .fill({ color: 0x2a663e });

      treeContainer.addChild(gfx);
      this.container.addChild(treeContainer);

      // Trunk Solid Collider
      const col = new CircleCollider({
        id: `tree_${i}`,
        x: pos.x,
        y: pos.y,
        radius: 12,
        category: CollisionCategory.OBSTACLE,
        tag: 'CAMPUS_TREE',
      });
      this.colliders.push(col);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. STREETLIGHTS & ILLUMINATION HALOS
  // ---------------------------------------------------------------------------
  private buildStreetlights(): void {
    const lightPositions = [
      { x: 1720, y: 1080 },
      { x: 1880, y: 1080 },
      { x: 1720, y: 1320 },
      { x: 1880, y: 1320 },
      { x: 1800, y: 980 },
      { x: 1800, y: 1420 },
      { x: 1250, y: 1420 },
      { x: 2350, y: 1420 },
      { x: 2750, y: 1420 },
    ];

    for (let i = 0; i < lightPositions.length; i++) {
      const pos = lightPositions[i]!;
      const lightCont = new Container();
      lightCont.zIndex = pos.y + 5;

      const gfx = new Graphics();

      // Ground Light Halo (Subtle illumination circle)
      gfx
        .circle(pos.x, pos.y + 8, 48)
        .fill({ color: 0x38bdf8, alpha: 0.12 });

      // Lamp Post Base & Mast
      gfx.circle(pos.x, pos.y, 4).fill({ color: 0x475569 });
      gfx.moveTo(pos.x, pos.y).lineTo(pos.x, pos.y - 28).stroke({ color: 0x64748b, width: 2.5 });

      // Lantern Fixture & Glowing Bulb
      gfx.roundRect(pos.x - 5, pos.y - 32, 10, 5, 2).fill({ color: 0x334155 });
      gfx.circle(pos.x, pos.y - 30, 3).fill({ color: 0x00f0ff });

      lightCont.addChild(gfx);
      this.container.addChild(lightCont);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. BENCHES & CAMPUS DIRECTORY SIGNPOSTS
  // ---------------------------------------------------------------------------
  private buildBenchesAndSignage(): void {
    const benchPositions = [
      { x: 1710, y: 1160, rot: 0 },
      { x: 1890, y: 1160, rot: 0 },
      { x: 1710, y: 1240, rot: 0 },
      { x: 1890, y: 1240, rot: 0 },
    ];

    for (let i = 0; i < benchPositions.length; i++) {
      const pos = benchPositions[i]!;
      const benchCont = new Container();
      benchCont.zIndex = pos.y + 2;

      const gfx = new Graphics();
      // Drop shadow
      gfx.ellipse(pos.x, pos.y + 3, 20, 6).fill({ color: 0x000000, alpha: 0.4 });
      // Bench slats
      gfx.roundRect(pos.x - 18, pos.y - 6, 36, 12, 2).fill({ color: 0x1e293b }).stroke({ color: 0x475569, width: 1 });
      gfx.rect(pos.x - 15, pos.y - 4, 30, 2).fill({ color: 0x64748b });

      benchCont.addChild(gfx);
      this.container.addChild(benchCont);

      const col = new BoxCollider({
        id: `bench_${i}`,
        x: pos.x - 18,
        y: pos.y - 6,
        width: 36,
        height: 12,
        category: CollisionCategory.OBSTACLE,
        tag: 'PLAZA_BENCH',
      });
      this.colliders.push(col);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. GROUND SUPPORT EQUIPMENT (Cargo Carts & Propellant Trailers)
  // ---------------------------------------------------------------------------
  private buildGroundSupportEquipment(): void {
    // Electric Cargo Haulers (Near VAB & Spacecraft Lab)
    const cartPositions = [
      { x: 2650, y: 1280, color: 0xf59e0b },
      { x: 780, y: 620, color: 0x38bdf8 },
    ];

    for (let i = 0; i < cartPositions.length; i++) {
      const cart = cartPositions[i]!;
      const cartCont = new Container();
      cartCont.zIndex = cart.y + 10;

      const gfx = new Graphics();
      // Drop shadow
      gfx.roundRect(cart.x - 22, cart.y - 12, 44, 28, 4).fill({ color: 0x000000, alpha: 0.5 });
      // Cart Body
      gfx.roundRect(cart.x - 20, cart.y - 14, 40, 24, 4).fill({ color: cart.color }).stroke({ color: 0x1e293b, width: 1.5 });
      // Cab & Wheels
      gfx.rect(cart.x + 8, cart.y - 12, 10, 20).fill({ color: 0x0f172a });
      gfx.circle(cart.x - 14, cart.y - 14, 3).fill({ color: 0x020617 });
      gfx.circle(cart.x + 14, cart.y - 14, 3).fill({ color: 0x020617 });
      gfx.circle(cart.x - 14, cart.y + 10, 3).fill({ color: 0x020617 });
      gfx.circle(cart.x + 14, cart.y + 10, 3).fill({ color: 0x020617 });

      cartCont.addChild(gfx);
      this.container.addChild(cartCont);

      const col = new BoxCollider({
        id: `gse_cart_${i}`,
        x: cart.x - 20,
        y: cart.y - 14,
        width: 40,
        height: 24,
        category: CollisionCategory.OBSTACLE,
        tag: 'CARGO_HAULER',
      });
      this.colliders.push(col);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. DEEP SPACE NETWORK (DSN) TRACKING DISHES (South-West)
  // ---------------------------------------------------------------------------
  private buildTrackingDishes(): void {
    const dishPositions = [
      { x: 1080, y: 2150, radius: 42 },
      { x: 1320, y: 2150, radius: 42 },
    ];

    for (let i = 0; i < dishPositions.length; i++) {
      const dish = dishPositions[i]!;
      const dishCont = new Container();
      dishCont.zIndex = dish.y + 20;

      const gfx = new Graphics();
      // Concrete pedestal drop shadow
      gfx.ellipse(dish.x, dish.y + 15, dish.radius * 1.1, dish.radius * 0.45).fill({ color: 0x000000, alpha: 0.5 });

      // Concrete Pedestal Base
      gfx.circle(dish.x, dish.y, 22).fill({ color: 0x334155 }).stroke({ color: 0x64748b, width: 2 });

      // Parabolic Dish (Angled skyward at 45 degrees)
      gfx
        .ellipse(dish.x, dish.y - 20, dish.radius, dish.radius * 0.65)
        .fill({ color: 0xe2e8f0 })
        .stroke({ color: 0x0ea5e9, width: 2.5 });

      // Dish mesh concentric circles
      gfx.ellipse(dish.x, dish.y - 20, dish.radius * 0.6, dish.radius * 0.4).stroke({ color: 0x94a3b8, width: 1.5 });

      // Sub-reflector feed tripod horn
      gfx.moveTo(dish.x - 25, dish.y - 20).lineTo(dish.x, dish.y - 35).stroke({ color: 0x475569, width: 2 });
      gfx.moveTo(dish.x + 25, dish.y - 20).lineTo(dish.x, dish.y - 35).stroke({ color: 0x475569, width: 2 });
      gfx.circle(dish.x, dish.y - 35, 4).fill({ color: 0xef4444 }); // Feed horn tip

      dishCont.addChild(gfx);
      this.container.addChild(dishCont);

      const col = new CircleCollider({
        id: `dsn_dish_${i}`,
        x: dish.x,
        y: dish.y,
        radius: 24,
        category: CollisionCategory.SOLID,
        tag: 'DSN_ANTENNA_BASE',
      });
      this.colliders.push(col);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. LAUNCH PAD INFRASTRUCTURE (Tower & Cryogenic Tanks)
  // ---------------------------------------------------------------------------
  private buildLaunchPadInfrastructure(): void {
    // A. Steel Truss Umbilical Service Tower (Pad Alpha East Flank: x: 3260, y: 1820)
    const towerX = 3260;
    const towerY = 1820;
    const towerCont = new Container();
    towerCont.zIndex = towerY + 50;

    const towerGfx = new Graphics();
    // Drop shadow
    towerGfx.rect(towerX - 25, towerY - 15, 50, 40).fill({ color: 0x000000, alpha: 0.6 });

    // Tower base platform
    towerGfx.rect(towerX - 22, towerY - 18, 44, 36).fill({ color: 0x1e293b }).stroke({ color: 0xef4444, width: 2 });

    // Vertical Red-and-White Steel Truss Tower (Height: 180px)
    const towerH = 180;
    const towerW = 32;
    const topY = towerY - towerH;

    towerGfx.rect(towerX - towerW / 2, topY, towerW, towerH).fill({ color: 0xdc2626 });

    // White checker bands
    for (let by = topY; by < towerY; by += 40) {
      towerGfx.rect(towerX - towerW / 2, by, towerW, 20).fill({ color: 0xf8fafc });
    }

    // Truss diagonal cross bracing lines
    towerGfx.stroke({ color: 0x7f1d1d, width: 2 });
    for (let by = topY; by < towerY; by += 20) {
      towerGfx
        .moveTo(towerX - towerW / 2, by)
        .lineTo(towerX + towerW / 2, by + 20)
        .moveTo(towerX + towerW / 2, by)
        .lineTo(towerX - towerW / 2, by + 20);
    }

    // Swing-arm propellant umbilical booms pointing West toward Pad center
    towerGfx
      .moveTo(towerX - towerW / 2, towerY - 60)
      .lineTo(towerX - towerW / 2 - 45, towerY - 60)
      .stroke({ color: 0x94a3b8, width: 4 });
    towerGfx
      .moveTo(towerX - towerW / 2, towerY - 120)
      .lineTo(towerX - towerW / 2 - 50, towerY - 120)
      .stroke({ color: 0x94a3b8, width: 4 });

    // Top Lightning Mast
    towerGfx.moveTo(towerX, topY).lineTo(towerX, topY - 35).stroke({ color: 0x94a3b8, width: 2 });
    towerGfx.circle(towerX, topY - 37, 4).fill({ color: 0xef4444 }); // Flashing beacon

    towerCont.addChild(towerGfx);
    this.container.addChild(towerCont);

    const towerCol = new BoxCollider({
      id: 'col_umbilical_tower',
      x: towerX - 22,
      y: towerY - 18,
      width: 44,
      height: 36,
      category: CollisionCategory.SOLID,
      tag: 'UMBILICAL_SERVICE_TOWER',
    });
    this.colliders.push(towerCol);

    // B. Spherical Cryogenic Fuel Tanks (LOX and LH2 Spheres near Pad Alpha)
    const cryoTanks = [
      { x: 3320, y: 1650, r: 35, label: 'LOX' },
      { x: 3410, y: 1650, r: 35, label: 'LH2' },
    ];

    for (let i = 0; i < cryoTanks.length; i++) {
      const tank = cryoTanks[i]!;
      const tankCont = new Container();
      tankCont.zIndex = tank.y + 15;

      const gfx = new Graphics();
      // Shadow
      gfx.ellipse(tank.x, tank.y + 10, tank.r * 1.1, tank.r * 0.45).fill({ color: 0x000000, alpha: 0.5 });
      // Tripod legs
      gfx.moveTo(tank.x - 20, tank.y + 15).lineTo(tank.x, tank.y).stroke({ color: 0x475569, width: 3 });
      gfx.moveTo(tank.x + 20, tank.y + 15).lineTo(tank.x, tank.y).stroke({ color: 0x475569, width: 3 });
      // Sphere Body
      gfx.circle(tank.x, tank.y - 10, tank.r).fill({ color: 0xf1f5f9 }).stroke({ color: 0x0284c7, width: 3 });
      // Cold frost equator ring
      gfx.ellipse(tank.x, tank.y - 10, tank.r * 0.95, tank.r * 0.35).stroke({ color: 0x38bdf8, width: 2 });

      tankCont.addChild(gfx);
      this.container.addChild(tankCont);

      const col = new CircleCollider({
        id: `cryo_sphere_${tank.label}`,
        x: tank.x,
        y: tank.y,
        radius: 28,
        category: CollisionCategory.SOLID,
        tag: `CRYO_TANK_${tank.label}`,
      });
      this.colliders.push(col);
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.colliders.length = 0;
  }
}
