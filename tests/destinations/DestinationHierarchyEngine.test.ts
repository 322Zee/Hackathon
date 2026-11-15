import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DestinationHierarchyEngine } from '../../src/destinations/navigation/DestinationHierarchyEngine';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { ExplorationStatusBadge } from '../../src/destinations/navigation/NavigationTypes';

describe('DestinationHierarchyEngine', () => {
  let engine: DestinationHierarchyEngine;

  beforeEach(() => {
    DestinationHierarchyEngine.resetInstance();
    DestinationRegistry.resetInstance();
    engine = DestinationHierarchyEngine.getInstance();
  });

  afterEach(() => {
    DestinationHierarchyEngine.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('1. builds full Solar System hierarchy tree rooted at the Sun', () => {
    const root = engine.buildHierarchy();
    expect(root).toBeDefined();
    expect(root.destination.id).toBe(DestinationId.SUN);
    expect(root.level).toBe(0);
    expect(root.children.length).toBeGreaterThanOrEqual(8); // Primary planets
  });

  it('2. retrieves individual hierarchy nodes with accurate sub-destinations', () => {
    const earthNode = engine.getNode(DestinationId.EARTH);
    expect(earthNode).toBeDefined();
    expect(earthNode?.destination.id).toBe(DestinationId.EARTH);
    expect(earthNode?.hasChildren).toBe(true);

    const childIds = earthNode?.children.map((c) => c.destination.id) ?? [];
    expect(childIds).toContain(DestinationId.MOON);
    expect(childIds).toContain(DestinationId.EARTH_ORBIT_LEO);

    const jupiterNode = engine.getNode(DestinationId.JUPITER);
    expect(jupiterNode).toBeDefined();
    const jupiterChildIds = jupiterNode?.children.map((c) => c.destination.id) ?? [];
    expect(jupiterChildIds).toContain(DestinationId.IO);
    expect(jupiterChildIds).toContain(DestinationId.EUROPA);
    expect(jupiterChildIds).toContain(DestinationId.GANYMEDE);
    expect(jupiterChildIds).toContain(DestinationId.CALLISTO);
  });

  it('3. generates correct breadcrumb trails for deeply nested destinations', () => {
    const europaTrail = engine.getBreadcrumbs(DestinationId.EUROPA);
    expect(europaTrail.length).toBe(3);
    expect(europaTrail[0]?.id).toBe(DestinationId.SUN);
    expect(europaTrail[1]?.id).toBe(DestinationId.JUPITER);
    expect(europaTrail[2]?.id).toBe(DestinationId.EUROPA);

    const leoTrail = engine.getBreadcrumbs(DestinationId.EARTH_ORBIT_LEO);
    expect(leoTrail.length).toBe(3);
    expect(leoTrail[0]?.id).toBe(DestinationId.SUN);
    expect(leoTrail[1]?.id).toBe(DestinationId.EARTH);
    expect(leoTrail[2]?.id).toBe(DestinationId.EARTH_ORBIT_LEO);

    const earthTrail = engine.getBreadcrumbs(DestinationId.EARTH);
    expect(earthTrail.length).toBe(2);
    expect(earthTrail[0]?.id).toBe(DestinationId.SUN);
    expect(earthTrail[1]?.id).toBe(DestinationId.EARTH);
  });

  it('4. returns parent and children records accurately', () => {
    const titanParent = engine.getParent(DestinationId.TITAN);
    expect(titanParent?.id).toBe(DestinationId.SATURN);

    const saturnChildren = engine.getChildren(DestinationId.SATURN);
    const saturnChildIds = saturnChildren.map((c) => c.id);
    expect(saturnChildIds).toContain(DestinationId.TITAN);
    expect(saturnChildIds).toContain(DestinationId.ENCELADUS);

    expect(engine.hasChildren(DestinationId.SATURN)).toBe(true);
    expect(engine.hasChildren(DestinationId.MERCURY)).toBe(false);
  });

  it('5. resolves exploration status badges reflecting locked vs unlocked state', () => {
    const earthStatus = engine.resolveExplorationStatus(DestinationId.EARTH);
    expect(earthStatus).not.toBe(ExplorationStatusBadge.LOCKED);

    const saturnStatus = engine.resolveExplorationStatus(DestinationId.SATURN);
    // Locked initially until progression conditions are satisfied
    expect(saturnStatus).toBe(ExplorationStatusBadge.LOCKED);
  });
});

