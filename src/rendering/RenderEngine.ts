import { Application, Container, Graphics } from 'pixi.js';
import { VirtualResolution, ViewportTransform } from './VirtualResolution';
import { Logger } from '../core/logging/Logger';
import { EventBus } from '../core/EventBus';
import { DisplayConfig } from '../configuration/GameConfig';
import { RenderPipeline } from './pipeline/RenderPipeline';
import { RenderLayerType } from './layers/RenderLayerType';

export interface RenderLayers {
  background: Container;
  world: Container;
  entities: Container;
  effects: Container;
  hud: Container;
  screen: Container;
  transitionOverlay: Container;
}

export class RenderEngine {
  private app: Application;
  private containerElement: HTMLElement;
  private virtualResolution: VirtualResolution;
  private rootScene: Container = new Container();
  private pipeline!: RenderPipeline;
  private layers!: RenderLayers;
  private eventBus?: EventBus;
  private isInitialized = false;
  private resizeObserver?: ResizeObserver;

  constructor(containerElement: HTMLElement, displayConfig: DisplayConfig, eventBus?: EventBus) {
    this.containerElement = containerElement;
    this.eventBus = eventBus;
    this.virtualResolution = new VirtualResolution(
      displayConfig.virtualWidth,
      displayConfig.virtualHeight,
      displayConfig.resolutionScale
    );
    this.app = new Application();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    Logger.info('RENDER_ENGINE', 'Initializing PixiJS v8 Application renderer...');

    await this.app.init({
      resizeTo: this.containerElement,
      backgroundColor: 0x030712,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      powerPreference: 'high-performance',
    });

    this.containerElement.appendChild(this.app.canvas);

    this.setupLayers();
    this.setupParallaxStars();
    this.setupContextLossHandling();
    this.setupResizeHandling();

    // Initial viewport calculation
    this.handleResize();

    this.isInitialized = true;
    Logger.info('RENDER_ENGINE', 'Render engine initialized successfully.');
  }

  private setupLayers(): void {
    this.rootScene.label = 'RootScene:VirtualSpace';
    this.app.stage.addChild(this.rootScene);

    // Initialize 12-Layer Rendering Pipeline
    this.pipeline = new RenderPipeline(this.rootScene, this.virtualResolution);

    // Map backwards-compatible layer aliases for existing scenes and transitions
    this.layers = {
      background: this.pipeline.getLayerContainer(RenderLayerType.BACKGROUND),
      world: this.pipeline.getLayerContainer(RenderLayerType.WORLD),
      entities: this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS),
      effects: this.pipeline.getLayerContainer(RenderLayerType.WORLD_EFFECTS),
      hud: this.pipeline.getLayerContainer(RenderLayerType.HUD),
      screen: this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY),
      transitionOverlay: this.pipeline.getLayerContainer(RenderLayerType.CINEMATIC_OVERLAY),
    };
  }

  private setupParallaxStars(): void {
    const starGraphics = new Graphics();
    const vw = this.virtualResolution.getVirtualWidth();
    const vh = this.virtualResolution.getVirtualHeight();

    for (let i = 0; i < 350; i++) {
      const x = Math.random() * vw;
      const y = Math.random() * vh;
      const radius = Math.random() * 1.5 + 0.4;
      const alpha = Math.random() * 0.8 + 0.2;
      starGraphics.circle(x, y, radius);
      starGraphics.fill({ color: 0xffffff, alpha });
    }

    this.layers.background.addChild(starGraphics);
  }

  private setupResizeHandling(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.containerElement);
    } else {
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }

  private handleResize(): void {
    if (!this.app.renderer) return;

    const physicalWidth = this.containerElement.clientWidth || window.innerWidth;
    const physicalHeight = this.containerElement.clientHeight || window.innerHeight;

    this.app.renderer.resize(physicalWidth, physicalHeight);

    const transform = this.virtualResolution.updateViewport(physicalWidth, physicalHeight);

    // Apply coordinate transformation to the root scene container
    this.rootScene.position.set(transform.offsetX, transform.offsetY);
    this.rootScene.scale.set(transform.scale);

    if (this.eventBus) {
      this.eventBus.emit('window:resized', {
        width: physicalWidth,
        height: physicalHeight,
        scale: transform.scale,
      });
    }
  }

  private setupContextLossHandling(): void {
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        Logger.error('RENDER_ENGINE', 'WebGL context lost. Pausing rendering.');
      });

      canvas.addEventListener('webglcontextrestored', () => {
        Logger.info('RENDER_ENGINE', 'WebGL context restored. Rebuilding rendering state.');
        this.handleResize();
      });
    }
  }

  public getVirtualResolution(): VirtualResolution {
    return this.virtualResolution;
  }

  public getTransform(): ViewportTransform {
    return this.virtualResolution.getTransform();
  }

  public getLayers(): RenderLayers {
    return this.layers;
  }

  public getPipeline(): RenderPipeline {
    if (!this.pipeline) {
      this.pipeline = new RenderPipeline(this.rootScene, this.virtualResolution);
    }
    return this.pipeline;
  }

  public getApp(): Application {
    return this.app;
  }

  public getRootScene(): Container {
    return this.rootScene;
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize.bind(this));
    }

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
    }
    this.isInitialized = false;
    Logger.info('RENDER_ENGINE', 'Render engine destroyed.');
  }
}
