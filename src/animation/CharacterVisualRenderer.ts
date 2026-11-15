/**
 * INTERSTELLAR CONTINUUM - Mission Director Character Visual Renderer
 * 2D/2.5D layered procedural character renderer with directional fidelity,
 * breathing/blinking idle motions, dynamic walk/run cycles, terminal interaction poses,
 * building transitions, and dynamic ground drop shadow.
 */

import { Container, Graphics } from 'pixi.js';
import {
  CharacterAnimationState,
  FacingDirection,
  AnimationFrameInfo,
} from './AnimationTypes';

export class CharacterVisualRenderer {
  public readonly container: Container;

  // Layered display nodes
  private shadowGraphics: Graphics;
  private contactFxGraphics: Graphics;
  private bodyContainer: Container;
  private legsGraphics: Graphics;
  private torsoGraphics: Graphics;
  private headGraphics: Graphics;
  private armsGraphics: Graphics;

  // Idle micro-animation accumulators
  private breathPhase: number = 0;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;

  // Stride contact effect timer
  private lastFootstepCycle: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'CharacterVisual';

    // 1. Ground Drop Shadow (always at ground level y=0)
    this.shadowGraphics = new Graphics();
    this.container.addChild(this.shadowGraphics);

    // 2. Ground Contact Dust / Stride FX
    this.contactFxGraphics = new Graphics();
    this.container.addChild(this.contactFxGraphics);

    // 3. Body Container (bobs, tilts, and breathes)
    this.bodyContainer = new Container();
    this.container.addChild(this.bodyContainer);

    this.legsGraphics = new Graphics();
    this.armsGraphics = new Graphics();
    this.torsoGraphics = new Graphics();
    this.headGraphics = new Graphics();

    this.bodyContainer.addChild(this.legsGraphics);
    this.bodyContainer.addChild(this.torsoGraphics);
    this.bodyContainer.addChild(this.armsGraphics);
    this.bodyContainer.addChild(this.headGraphics);
  }

  /**
   * Main render update called each frame with current animation state and timing
   */
  public render(
    state: CharacterAnimationState,
    direction: FacingDirection,
    frameInfo: AnimationFrameInfo,
    deltaSeconds: number
  ): void {
    // 1. Update Idle breathing and eye blink cadence
    this.breathPhase += deltaSeconds * 2.1; // ~3.0s breathing period
    this.blinkTimer += deltaSeconds;
    if (this.blinkTimer > 3.8) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.0) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // 2. Compute state-specific kinematic variables
    const norm = frameInfo.normalizedTime;
    let stride = 0;
    let bounce = 0;
    let forwardLean = 0;
    let interactArmPhase = 0;
    let transitionAlpha = 1.0;

    switch (state) {
      case CharacterAnimationState.IDLE: {
        // Subtle chest and shoulder breathing oscillation
        const breath = Math.sin(this.breathPhase) * 0.8;
        bounce = -breath;
        forwardLean = 0;
        break;
      }

      case CharacterAnimationState.WALK: {
        // Natural 8-frame walk stride
        stride = Math.sin(norm * Math.PI * 2);
        bounce = Math.abs(Math.sin(norm * Math.PI * 2)) * 3.0; // 3px bounce
        forwardLean = 0.02; // Very slight forward tilt

        this.checkFootstepFx(stride);
        break;
      }

      case CharacterAnimationState.RUN: {
        // Aggressive 8-frame run stride
        stride = Math.sin(norm * Math.PI * 2) * 1.35; // Wider stride amplitude
        bounce = Math.abs(Math.sin(norm * Math.PI * 2)) * 4.8; // 4.8px bounce
        forwardLean = 0.09; // Distinct 5-degree forward lean

        this.checkFootstepFx(stride);
        break;
      }

      case CharacterAnimationState.INTERACT: {
        // Typing cadence on holographic terminal console
        interactArmPhase = Math.sin(norm * Math.PI * 8); // Rapid finger/arm typing
        bounce = 0.5;
        forwardLean = 0.04; // Leaning in slightly towards console
        break;
      }

      case CharacterAnimationState.ENTER_BUILDING: {
        // Walking forward into portal and fading out
        stride = Math.sin(norm * Math.PI * 2);
        bounce = Math.abs(Math.sin(norm * Math.PI * 2)) * 2.5;
        transitionAlpha = Math.max(0, 1.0 - norm * 1.2);
        break;
      }

      case CharacterAnimationState.EXIT_BUILDING: {
        // Emerging from portal and fading in
        stride = Math.sin(norm * Math.PI * 2);
        bounce = Math.abs(Math.sin(norm * Math.PI * 2)) * 2.5;
        transitionAlpha = Math.min(1.0, norm * 1.2);
        break;
      }

      case CharacterAnimationState.STOP_TRANSITION: {
        // Bracing foot plant to stop
        stride = 0.2;
        bounce = 1.5;
        forwardLean = 0.01;
        break;
      }
    }

    this.container.alpha = transitionAlpha;

    // 3. Render Ground Drop Shadow
    this.renderShadow(bounce);

    // 4. Position and tilt Body Container
    this.bodyContainer.position.y = -bounce;
    if (direction === FacingDirection.EAST) {
      this.bodyContainer.rotation = forwardLean;
    } else if (direction === FacingDirection.WEST) {
      this.bodyContainer.rotation = -forwardLean;
    } else {
      this.bodyContainer.rotation = 0;
    }

    // 5. Draw Layered Body Parts
    this.drawCharacterGeometry(state, direction, stride, interactArmPhase);
  }

  /**
   * Ground contact shadow attached to (0, 0)
   * Squashes on foot plant and softens/shrinks on peak bounce
   */
  private renderShadow(bounce: number): void {
    this.shadowGraphics.clear();
    const shadowWidth = Math.max(24, 36 - bounce * 1.2);
    const shadowHeight = Math.max(10, 16 - bounce * 0.6);
    const shadowAlpha = Math.max(0.2, 0.38 - bounce * 0.02);

    this.shadowGraphics
      .ellipse(0, 0, shadowWidth / 2, shadowHeight / 2)
      .fill({ color: 0x000000, alpha: shadowAlpha });
  }

  /**
   * Trigger subtle dust particle ring on footstep plant during run/walk
   */
  private checkFootstepFx(stride: number): void {
    const isFootplant = Math.abs(stride) > 0.95;
    if (isFootplant && Math.abs(this.lastFootstepCycle - stride) > 0.5) {
      this.lastFootstepCycle = stride;
      this.triggerFootstepPuff(stride > 0 ? 6 : -6);
    }
  }

  private triggerFootstepPuff(footOffsetX: number): void {
    this.contactFxGraphics.clear();
    this.contactFxGraphics
      .circle(footOffsetX, 0, 4)
      .stroke({ color: 0x64748b, width: 1.2, alpha: 0.35 });
  }

  /**
   * Layered 2D/2.5D composite rendering of the Mission Director
   */
  private drawCharacterGeometry(
    state: CharacterAnimationState,
    direction: FacingDirection,
    stride: number,
    interactArmPhase: number
  ): void {
    this.legsGraphics.clear();
    this.torsoGraphics.clear();
    this.headGraphics.clear();
    this.armsGraphics.clear();

    // Professional Aerospace Palette
    const cBlazer = 0x1b2838; // Navy blue executive blazer
    const cBlazerTrim = 0x24374d; // Accent lapels
    const cShirt = 0xedf2f7; // Crisp light collared shirt
    const cLanyard = 0x00f0ff; // Corporate cyan lanyard
    const cBadge = 0xffd700; // Gold security clearance pass
    const cPants = 0x2d3748; // Slate tailored trousers
    const cShoes = 0x11161d; // Dark polished dress boots
    const cSkin = 0xebcbb0; // Skin tone
    const cHair = 0x261a14; // Styled dark hair

    const legSwing = stride * 7.0;
    const armSwing = -stride * 8.0;
    const breathOffset = state === CharacterAnimationState.IDLE ? Math.sin(this.breathPhase) * 0.6 : 0;

    switch (direction) {
      case FacingDirection.SOUTH: {
        // ================= FRONT VIEW (FACING CAMERA) =================
        // Legs
        this.legsGraphics
          .roundRect(-10, -22, 8, 20 + legSwing * 0.3, 3)
          .fill({ color: cPants }) // Left leg
          .roundRect(2, -22, 8, 20 - legSwing * 0.3, 3)
          .fill({ color: cPants }) // Right leg
          .roundRect(-11, -4 + legSwing * 0.3, 9, 6, 2)
          .fill({ color: cShoes }) // Left shoe
          .roundRect(2, -4 - legSwing * 0.3, 9, 6, 2)
          .fill({ color: cShoes }); // Right shoe

        // Torso / Blazer with breathing expand
        this.torsoGraphics
          .roundRect(-14 - breathOffset * 0.5, -46 - breathOffset, 28 + breathOffset, 26 + breathOffset, 4)
          .fill({ color: cBlazer })
          .poly([-4, -46 - breathOffset, 4, -46 - breathOffset, 0, -32])
          .fill({ color: cShirt }) // Shirt V-neck
          // Lapels
          .poly([-4, -46 - breathOffset, -10, -42, -5, -34])
          .fill({ color: cBlazerTrim })
          .poly([4, -46 - breathOffset, 10, -42, 5, -34])
          .fill({ color: cBlazerTrim })
          // Agency Lanyard & Badge
          .moveTo(-3, -46 - breathOffset)
          .lineTo(-1, -33)
          .stroke({ color: cLanyard, width: 2 })
          .moveTo(3, -46 - breathOffset)
          .lineTo(-1, -33)
          .stroke({ color: cLanyard, width: 2 })
          .rect(-3, -33, 5, 7)
          .fill({ color: cBadge });

        // Arms & Hands
        if (state === CharacterAnimationState.INTERACT) {
          // Both arms raised typing on console
          const armY = -38 + interactArmPhase * 2;
          this.armsGraphics
            .roundRect(-17, armY, 6, 18, 3)
            .fill({ color: cBlazer })
            .circle(-14, armY + 18, 3)
            .fill({ color: cSkin })
            .roundRect(11, armY - interactArmPhase * 2, 6, 18, 3)
            .fill({ color: cBlazer })
            .circle(14, armY + 18 - interactArmPhase * 2, 3)
            .fill({ color: cSkin });
        } else {
          // Normal arm swings
          this.armsGraphics
            .roundRect(-18, -45 + armSwing * 0.4, 6, 22, 3)
            .fill({ color: cBlazer })
            .circle(-15, -23 + armSwing * 0.4, 3)
            .fill({ color: cSkin })
            .roundRect(12, -45 - armSwing * 0.4, 6, 22, 3)
            .fill({ color: cBlazer })
            .circle(15, -23 - armSwing * 0.4, 3)
            .fill({ color: cSkin });
        }

        // Head & Eyes
        this.headGraphics
          .roundRect(-9, -64, 18, 18, 5)
          .fill({ color: cSkin })
          .roundRect(-10, -68, 20, 10, 4)
          .fill({ color: cHair });

        if (!this.isBlinking) {
          this.headGraphics
            .rect(-5, -57, 2, 3)
            .fill({ color: 0x11161d })
            .rect(3, -57, 2, 3)
            .fill({ color: 0x11161d });
        } else {
          // Blinking eye slit
          this.headGraphics
            .rect(-5, -56, 3, 1)
            .fill({ color: 0x222222 })
            .rect(3, -56, 3, 1)
            .fill({ color: 0x222222 });
        }
        break;
      }

      case FacingDirection.NORTH: {
        // ================= BACK VIEW =================
        // Legs
        this.legsGraphics
          .roundRect(-10, -22, 8, 20 - legSwing * 0.3, 3)
          .fill({ color: cPants })
          .roundRect(2, -22, 8, 20 + legSwing * 0.3, 3)
          .fill({ color: cPants })
          .roundRect(-11, -4 - legSwing * 0.3, 9, 6, 2)
          .fill({ color: cShoes })
          .roundRect(2, -4 + legSwing * 0.3, 9, 6, 2)
          .fill({ color: cShoes });

        // Torso back
        this.torsoGraphics
          .roundRect(-14 - breathOffset * 0.5, -46 - breathOffset, 28 + breathOffset, 26 + breathOffset, 4)
          .fill({ color: cBlazer })
          .stroke({ color: cBlazerTrim, width: 1 });

        // Arms
        if (state === CharacterAnimationState.INTERACT) {
          // Reaching forward into screen
          this.armsGraphics
            .roundRect(-16, -45 - interactArmPhase * 2, 6, 17, 3)
            .fill({ color: cBlazer })
            .roundRect(10, -45 + interactArmPhase * 2, 6, 17, 3)
            .fill({ color: cBlazer });
        } else {
          this.armsGraphics
            .roundRect(-18, -45 - armSwing * 0.4, 6, 22, 3)
            .fill({ color: cBlazer })
            .roundRect(12, -45 + armSwing * 0.4, 6, 22, 3)
            .fill({ color: cBlazer });
        }

        // Head back with full hair
        this.headGraphics
          .roundRect(-10, -68, 20, 20, 6)
          .fill({ color: cHair });
        break;
      }

      case FacingDirection.EAST: {
        // ================= PROFILE RIGHT =================
        // Legs with depth shading on back leg
        this.legsGraphics
          .roundRect(-6 + legSwing, -22, 8, 21, 3)
          .fill({ color: cPants })
          .roundRect(-4 - legSwing, -22, 8, 21, 3)
          .fill({ color: 0x1e2733 }) // Shaded rear leg
          .roundRect(-5 + legSwing, -3, 11, 5, 2)
          .fill({ color: cShoes })
          .roundRect(-3 - legSwing, -3, 11, 5, 2)
          .fill({ color: cShoes });

        // Torso
        this.torsoGraphics
          .roundRect(-10, -46 - breathOffset, 18 + breathOffset * 0.5, 26 + breathOffset, 4)
          .fill({ color: cBlazer })
          .rect(4, -42, 3, 10)
          .fill({ color: cLanyard })
          .rect(5, -34, 4, 6)
          .fill({ color: cBadge });

        // Arm
        if (state === CharacterAnimationState.INTERACT) {
          // Arm extended rightwards towards console
          this.armsGraphics
            .roundRect(0, -42, 16, 6, 3)
            .fill({ color: cBlazer })
            .circle(16 + interactArmPhase * 3, -39, 3)
            .fill({ color: cSkin });
        } else {
          this.armsGraphics
            .roundRect(-4 + armSwing * 0.6, -45, 6, 22, 3)
            .fill({ color: cBlazer })
            .circle(-1 + armSwing * 0.6, -23, 3)
            .fill({ color: cSkin });
        }

        // Head
        this.headGraphics
          .roundRect(-8, -64, 16, 18, 4)
          .fill({ color: cSkin })
          .roundRect(-10, -68, 17, 10, 4)
          .fill({ color: cHair });

        if (!this.isBlinking) {
          this.headGraphics.rect(5, -57, 2, 3).fill({ color: 0x11161d });
        } else {
          this.headGraphics.rect(4, -56, 3, 1).fill({ color: 0x222222 });
        }
        break;
      }

      case FacingDirection.WEST: {
        // ================= PROFILE LEFT =================
        // Legs with depth shading
        this.legsGraphics
          .roundRect(-2 - legSwing, -22, 8, 21, 3)
          .fill({ color: cPants })
          .roundRect(-4 + legSwing, -22, 8, 21, 3)
          .fill({ color: 0x1e2733 })
          .roundRect(-6 - legSwing, -3, 11, 5, 2)
          .fill({ color: cShoes })
          .roundRect(-8 + legSwing, -3, 11, 5, 2)
          .fill({ color: cShoes });

        // Torso
        this.torsoGraphics
          .roundRect(-8, -46 - breathOffset, 18 + breathOffset * 0.5, 26 + breathOffset, 4)
          .fill({ color: cBlazer })
          .rect(-7, -42, 3, 10)
          .fill({ color: cLanyard })
          .rect(-9, -34, 4, 6)
          .fill({ color: cBadge });

        // Arm
        if (state === CharacterAnimationState.INTERACT) {
          // Arm extended leftwards towards console
          this.armsGraphics
            .roundRect(-16, -42, 16, 6, 3)
            .fill({ color: cBlazer })
            .circle(-16 - interactArmPhase * 3, -39, 3)
            .fill({ color: cSkin });
        } else {
          this.armsGraphics
            .roundRect(-2 - armSwing * 0.6, -45, 6, 22, 3)
            .fill({ color: cBlazer })
            .circle(1 - armSwing * 0.6, -23, 3)
            .fill({ color: cSkin });
        }

        // Head
        this.headGraphics
          .roundRect(-8, -64, 16, 18, 4)
          .fill({ color: cSkin })
          .roundRect(-7, -68, 17, 10, 4)
          .fill({ color: cHair });

        if (!this.isBlinking) {
          this.headGraphics.rect(-7, -57, 2, 3).fill({ color: 0x11161d });
        } else {
          this.headGraphics.rect(-7, -56, 3, 1).fill({ color: 0x222222 });
        }
        break;
      }
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
