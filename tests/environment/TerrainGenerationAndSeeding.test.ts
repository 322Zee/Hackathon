import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  TerrainHeightmapGenerator,
  TerrainCraterGenerator,
  TerrainFeatureGenerator,
  TerrainSectionAssembler,
  TerrainConfiguration,
  SurfaceVisualProperties,
} from '../../src/environment/planetary';

describe('Terrain Generation & Seed Reproducibility', () => {
  const baseTerrainConfig: TerrainConfiguration = {
    seed: 424242,
    baseElevation: 1400,
    heightVariation: 200,
    roughness: 0.5,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    segmentWidth: 600,
    totalWidth: 3600,
    craterFrequency: 0.6,
    minCraterRadius: 40,
    maxCraterRadius: 160,
    rockFrequency: 0.5,
    minRockSize: 10,
    maxRockSize: 30,
    surfaceFriction: 0.7,
    stepResolution: 20,
  };

  const baseVisuals: SurfaceVisualProperties = {
    primaryColor: 0x777777,
    secondaryColor: 0x999999,
    strataColors: [0x777777, 0x555555, 0x333333],
    rockColors: [0x666666, 0x444444],
    craterRimColor: 0xaaaaaa,
    craterFloorColor: 0x222222,
    regolithTextureStyle: 'ROCKY',
    shadowColor: 0x000000,
    shadowAlpha: 0.8,
  };

  it('SeededRandom produces deterministic pseudo-random sequences and supports state restore', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const values1 = [rng1.next(), rng1.nextFloat(10, 50), rng1.nextInt(1, 100)];
    const values2 = [rng2.next(), rng2.nextFloat(10, 50), rng2.nextInt(1, 100)];

    expect(values1).toEqual(values2);

    // Test state checkpointing
    const savedState = rng1.getState();
    const nextVal = rng1.next();

    rng1.setState(savedState);
    const restoredVal = rng1.next();
    expect(restoredVal).toBe(nextVal);
  });

  it('guarantees 100% reproducible terrain from identical seeds', () => {
    const assemblerA = new TerrainSectionAssembler(baseTerrainConfig, baseVisuals);
    const terrainA = assemblerA.generate('DEST_TEST');

    const assemblerB = new TerrainSectionAssembler(baseTerrainConfig, baseVisuals);
    const terrainB = assemblerB.generate('DEST_TEST');

    expect(terrainA.vertices.length).toBe(terrainB.vertices.length);
    expect(terrainA.craters.length).toBe(terrainB.craters.length);
    expect(terrainA.rocks.length).toBe(terrainB.rocks.length);

    // Verify bit-exact vertices
    for (let i = 0; i < terrainA.vertices.length; i++) {
      expect(terrainA.vertices[i]?.x).toBe(terrainB.vertices[i]?.x);
      expect(terrainA.vertices[i]?.y).toBe(terrainB.vertices[i]?.y);
      expect(terrainA.vertices[i]?.normalX).toBe(terrainB.vertices[i]?.normalX);
      expect(terrainA.vertices[i]?.normalY).toBe(terrainB.vertices[i]?.normalY);
    }

    // Verify bit-exact craters
    for (let i = 0; i < terrainA.craters.length; i++) {
      expect(terrainA.craters[i]?.centerX).toBe(terrainB.craters[i]?.centerX);
      expect(terrainA.craters[i]?.radius).toBe(terrainB.craters[i]?.radius);
      expect(terrainA.craters[i]?.depth).toBe(terrainB.craters[i]?.depth);
    }
  });

  it('diverges predictably when generated with different seeds', () => {
    const assembler1 = new TerrainSectionAssembler({ ...baseTerrainConfig, seed: 1111 }, baseVisuals);
    const terrain1 = assembler1.generate('DEST_TEST');

    const assembler2 = new TerrainSectionAssembler({ ...baseTerrainConfig, seed: 9999 }, baseVisuals);
    const terrain2 = assembler2.generate('DEST_TEST');

    let differencesCount = 0;
    const compareLength = Math.min(terrain1.vertices.length, terrain2.vertices.length);

    for (let i = 0; i < compareLength; i++) {
      if (terrain1.vertices[i]?.y !== terrain2.vertices[i]?.y) {
        differencesCount++;
      }
    }

    expect(differencesCount).toBeGreaterThan(compareLength * 0.8);
  });

  it('TerrainHeightmapGenerator produces smooth continuous elevations within configured bounds', () => {
    const heightmap = new TerrainHeightmapGenerator(baseTerrainConfig);

    const heights: number[] = [];
    for (let x = 0; x <= 1000; x += 10) {
      heights.push(heightmap.getElevationAt(x));
    }

    // Check bounds
    const minExpected = baseTerrainConfig.baseElevation - baseTerrainConfig.heightVariation * 1.5;
    const maxExpected = baseTerrainConfig.baseElevation + baseTerrainConfig.heightVariation * 1.5;

    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual(minExpected);
      expect(h).toBeLessThanOrEqual(maxExpected);
    }

    // Check continuity (no discontinuous jumps)
    for (let i = 1; i < heights.length; i++) {
      const delta = Math.abs((heights[i] ?? 0) - (heights[i - 1] ?? 0));
      expect(delta).toBeLessThan(35); // 10px step should not jump > 35px
    }
  });

  it('TerrainCraterGenerator accurately computes crater depressions and elevated rims', () => {
    const craterGen = new TerrainCraterGenerator(baseTerrainConfig);
    const craters = craterGen.generateCraters();
    expect(craters.length).toBeGreaterThan(0);

    const testCrater = craters[0]!;
    // At crater center, displacement should push downward (+Y displacement in canvas coordinates)
    const centerResult = craterGen.getCraterDisplacementAt(testCrater.centerX, [testCrater]);
    expect(centerResult.displacement).toBeGreaterThan(0);
    expect(centerResult.craterId).toBe(testCrater.id);

    // At rim (distance = radius), elevation should be pushed upward (negative displacement)
    const rimX = testCrater.centerX + testCrater.radius;
    const rimResult = craterGen.getCraterDisplacementAt(rimX, [testCrater]);
    expect(rimResult.displacement).toBeLessThan(0);

    // Far outside crater (distance > radius * 2), displacement should be zero
    const farX = testCrater.centerX + testCrater.radius * 3;
    const farResult = craterGen.getCraterDisplacementAt(farX, [testCrater]);
    expect(farResult.displacement).toBe(0);
  });

  it('TerrainFeatureGenerator creates polygonal rock geometry embedded in terrain', () => {
    const featureGen = new TerrainFeatureGenerator(baseTerrainConfig, baseVisuals);
    const rocks = featureGen.generateRocks((x) => 1400);

    expect(rocks.length).toBeGreaterThan(0);
    for (const rock of rocks) {
      expect(rock.width).toBeGreaterThanOrEqual(baseTerrainConfig.minRockSize);
      expect(rock.width).toBeLessThanOrEqual(baseTerrainConfig.maxRockSize);
      expect(rock.vertices.length).toBeGreaterThanOrEqual(5);
    }
  });
});
