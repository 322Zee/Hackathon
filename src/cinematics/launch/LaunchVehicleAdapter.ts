/**
 * INTERSTELLAR CONTINUUM - Launch Vehicle Visual Adapter
 * Transforms modular rocket project configurations or raw vehicle models into
 * rendered 2D/2.5D visual rocket assets with engine bells, dynamic throttle glow,
 * stage geometry, and optional strap-on boosters.
 */

import { Container, Graphics } from 'pixi.js';
import { LaunchVehiclePresentationData } from './LaunchCinematicTypes';
import { RocketProject } from '../../engineering/RocketProjectTypes';
import { ModularRocketConfiguration } from '../../engineering/builder/RocketBuilderTypes';

export class LaunchVehicleAdapter {
  /**
   * Normalize an engineering RocketProject or configuration into LaunchVehiclePresentationData
   */
  public static fromProject(project?: RocketProject): LaunchVehiclePresentationData {
    if (!project) {
      return this.getDefaultVehicleData();
    }

    const modularConfig: Partial<ModularRocketConfiguration> | undefined = (project as any).modularConfig;
    const stages = project.design?.stages ?? [];

    // Analyze stages & engines
    let engineCount = 1;
    let hasBoosters = false;
    let boosterCount = 0;
    let totalMassKg = project.design?.totalWetMassKg ?? 18500;

    for (const stage of stages) {
      if (stage.engineCount) {
        engineCount = Math.max(engineCount, stage.engineCount);
      }
      if (stage.name.toLowerCase().includes('booster') || stage.engineName.toLowerCase().includes('booster')) {
        hasBoosters = true;
        boosterCount += 2;
      }
    }

    // Check modular config slots if available
    if (modularConfig?.stages) {
      for (const st of modularConfig.stages) {
        for (const slot of st.slots ?? []) {
          if ((slot as any).slotType === 'BOOSTER_LEFT' || (slot as any).slotType === 'BOOSTER_RIGHT') {
            hasBoosters = true;
            boosterCount++;
          }
        }
      }
    }

    const primaryColor = 0xf8fafc; // Off-white aerospace composite
    const accentColor = 0x0284c7; // Deep cyan / cobalt
    const fairingColor = 0xe2e8f0; // Matte protective white

    return {
      projectId: project.projectId,
      vehicleName: project.name || 'Orbital Explorer-1',
      designVersion: project.designVersion || 'v1.0.0',
      stagesCount: Math.max(1, stages.length || 2),
      heightPx: 260,
      widthPx: 44,
      primaryColor,
      accentColor,
      fairingColor,
      hasBoosters,
      boosterCount: hasBoosters ? Math.max(2, boosterCount) : 0,
      thruster: {
        count: Math.min(5, Math.max(1, engineCount)),
        nozzleDiameterPx: 14,
        spacingPx: 16,
        plumeColorCore: 0xffffff,
        plumeColorOuter: 0xf97316,
        heatDistortionEnabled: true,
        smokeDensityMultiplier: 1.0,
      },
      massKg: totalMassKg,
      payloadName: project.assignedMissionId,
    };
  }

  /**
   * Generates a balanced default vehicle configuration
   */
  public static getDefaultVehicleData(): LaunchVehiclePresentationData {
    return {
      projectId: 'proj_default_vehicle',
      vehicleName: 'Astraea-IV Launch Vehicle',
      designVersion: 'v1.0.0',
      stagesCount: 2,
      heightPx: 260,
      widthPx: 46,
      primaryColor: 0xf8fafc,
      accentColor: 0x0284c7,
      fairingColor: 0xe2e8f0,
      hasBoosters: true,
      boosterCount: 2,
      thruster: {
        count: 3,
        nozzleDiameterPx: 14,
        spacingPx: 14,
        plumeColorCore: 0xffffff,
        plumeColorOuter: 0xf97316,
        heatDistortionEnabled: true,
        smokeDensityMultiplier: 1.0,
      },
      massKg: 18500,
      payloadName: 'Orbital Pioneer Probe',
    };
  }

  /**
   * Builds the complete hierarchical 2D/2.5D visual container of the vehicle.
   * Origin (0, 0) is at the nozzle exhaust exit line.
   */
  public static buildVehicleVisual(
    data: LaunchVehiclePresentationData
  ): {
    container: Container;
    nozzleGlowGfx: Graphics;
    setThrottleGlow: (throttle: number) => void;
  } {
    const container = new Container();
    container.label = `VehicleVisual_${data.vehicleName}`;

    const bodyGfx = new Graphics();
    container.addChild(bodyGfx);

    const halfW = data.widthPx / 2;
    const totalH = data.heightPx;
    const fairingH = Math.min(70, totalH * 0.28);
    const upperStageH = Math.min(50, totalH * 0.2);
    const coreH = totalH - fairingH - upperStageH - 18; // minus interstage & engine mount

    // 1. Core First Stage Body
    const coreYBottom = -18;
    const coreYTop = coreYBottom - coreH;

    // Body cylinder gradient shading simulation (Left shadow, center highlight, right shadow)
    bodyGfx.roundRect(-halfW, coreYTop, data.widthPx, coreH, 2);
    bodyGfx.fill({ color: data.primaryColor });
    bodyGfx.stroke({ color: 0x334155, width: 1.5 });

    // Livery accent stripe down center
    bodyGfx.rect(-3, coreYTop + 10, 6, coreH - 20);
    bodyGfx.fill({ color: data.accentColor, alpha: 0.85 });

    // Lateral roll control marker lines
    bodyGfx.rect(-halfW + 4, coreYBottom - 30, 4, 18);
    bodyGfx.rect(halfW - 8, coreYBottom - 30, 4, 18);
    bodyGfx.fill({ color: 0x0f172a });

    // 2. Interstage Decoupler Ring
    const interstageY = coreYTop - 8;
    bodyGfx.rect(-halfW - 1, interstageY, data.widthPx + 2, 8);
    bodyGfx.fill({ color: 0x475569 });
    bodyGfx.stroke({ color: 0x1e293b, width: 1 });

    // 3. Second / Upper Stage Body
    const upperYBottom = interstageY;
    const upperYTop = upperYBottom - upperStageH;
    bodyGfx.rect(-halfW + 2, upperYTop, data.widthPx - 4, upperStageH);
    bodyGfx.fill({ color: data.primaryColor });
    bodyGfx.stroke({ color: 0x334155, width: 1 });

    // Upper stage accent band
    bodyGfx.rect(-halfW + 2, upperYTop + 6, data.widthPx - 4, 6);
    bodyGfx.fill({ color: data.accentColor });

    // 4. Payload Fairing / Nose Cone (Smooth aerodynamic arch)
    const fairingBaseY = upperYTop;
    const fairingTipY = fairingBaseY - fairingH;

    bodyGfx.moveTo(-halfW, fairingBaseY);
    bodyGfx.bezierCurveTo(
      -halfW,
      fairingBaseY - fairingH * 0.45,
      -halfW * 0.6,
      fairingTipY + 8,
      0,
      fairingTipY
    );
    bodyGfx.bezierCurveTo(
      halfW * 0.6,
      fairingTipY + 8,
      halfW,
      fairingBaseY - fairingH * 0.45,
      halfW,
      fairingBaseY
    );
    bodyGfx.closePath();
    bodyGfx.fill({ color: data.fairingColor });
    bodyGfx.stroke({ color: 0x334155, width: 1.5 });

    // Fairing split separation line
    bodyGfx.moveTo(0, fairingTipY + 4);
    bodyGfx.lineTo(0, fairingBaseY);
    bodyGfx.stroke({ color: 0x94a3b8, width: 1, alpha: 0.6 });

    // 5. Solid / Liquid Strap-On Boosters (If enabled)
    if (data.hasBoosters && data.boosterCount >= 2) {
      const boosterW = 14;
      const boosterH = coreH * 0.8;
      const boosterDist = halfW + boosterW / 2 + 1;

      for (const side of [-1, 1]) {
        const bx = side * boosterDist;
        const bBottom = -12;
        const bTop = bBottom - boosterH;

        // Booster cylinder
        bodyGfx.roundRect(bx - boosterW / 2, bTop, boosterW, boosterH, 2);
        bodyGfx.fill({ color: 0xe2e8f0 });
        bodyGfx.stroke({ color: 0x475569, width: 1 });

        // Booster aerodynamic nose cone
        bodyGfx.moveTo(bx - boosterW / 2, bTop);
        bodyGfx.lineTo(bx, bTop - 18);
        bodyGfx.lineTo(bx + boosterW / 2, bTop);
        bodyGfx.closePath();
        bodyGfx.fill({ color: data.accentColor });
        bodyGfx.stroke({ color: 0x475569, width: 1 });

        // Structural attachment strut
        bodyGfx.rect(side > 0 ? halfW : -halfW - 3, bTop + 24, 3, 6);
        bodyGfx.rect(side > 0 ? halfW : -halfW - 3, bBottom - 20, 3, 6);
        bodyGfx.fill({ color: 0x334155 });

        // Booster nozzle bell
        bodyGfx.moveTo(bx - 5, bBottom);
        bodyGfx.lineTo(bx - 7, 0);
        bodyGfx.lineTo(bx + 7, 0);
        bodyGfx.lineTo(bx + 5, bBottom);
        bodyGfx.closePath();
        bodyGfx.fill({ color: 0x1e293b });
      }
    }

    // 6. Main Engine Nozzles
    const numEngines = data.thruster.count;
    const nozzleW = data.thruster.nozzleDiameterPx;
    const spacing = data.thruster.spacingPx;
    const totalEnginesW = (numEngines - 1) * spacing;
    const startX = -totalEnginesW / 2;

    for (let i = 0; i < numEngines; i++) {
      const ex = startX + i * spacing;
      // Nozzle bell conical flare
      bodyGfx.moveTo(ex - nozzleW * 0.35, -18);
      bodyGfx.lineTo(ex - nozzleW * 0.5, 0);
      bodyGfx.lineTo(ex + nozzleW * 0.5, 0);
      bodyGfx.lineTo(ex + nozzleW * 0.35, -18);
      bodyGfx.closePath();
      bodyGfx.fill({ color: 0x1e293b });
      bodyGfx.stroke({ color: 0x0f172a, width: 1 });

      // Nozzle interior chamber
      bodyGfx.ellipse(ex, 0, nozzleW * 0.5, 2.5);
      bodyGfx.fill({ color: 0x090d16 });
    }

    // 7. Dynamic Engine Glow / Bloom Layer
    const nozzleGlowGfx = new Graphics();
    nozzleGlowGfx.position.set(0, 0);
    nozzleGlowGfx.alpha = 0;
    container.addChild(nozzleGlowGfx);

    const setThrottleGlow = (throttle: number) => {
      nozzleGlowGfx.clear();
      if (throttle <= 0.01) {
        nozzleGlowGfx.alpha = 0;
        return;
      }

      nozzleGlowGfx.alpha = Math.min(1.0, throttle);

      for (let i = 0; i < numEngines; i++) {
        const ex = startX + i * spacing;
        // Hot nozzle bell interior bloom
        nozzleGlowGfx.ellipse(ex, 0, nozzleW * 0.6 * throttle, 3.5 * throttle);
        nozzleGlowGfx.fill({ color: data.thruster.plumeColorCore, alpha: 0.95 });

        // Outer thermal radiative halo
        nozzleGlowGfx.circle(ex, 2, nozzleW * 1.2 * throttle);
        nozzleGlowGfx.fill({ color: data.thruster.plumeColorOuter, alpha: 0.35 * throttle });
      }
    };

    return {
      container,
      nozzleGlowGfx,
      setThrottleGlow,
    };
  }
}
