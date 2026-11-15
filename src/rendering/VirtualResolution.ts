export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
  virtualWidth: number;
  virtualHeight: number;
}

export class VirtualResolution {
  private readonly virtualWidth: number;
  private readonly virtualHeight: number;
  private resolutionScale: number;
  private transform: ViewportTransform;

  constructor(virtualWidth: number = 1920, virtualHeight: number = 1080, resolutionScale: number = 1.0) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.resolutionScale = resolutionScale;
    this.transform = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      viewportWidth: virtualWidth,
      viewportHeight: virtualHeight,
      virtualWidth,
      virtualHeight,
    };
  }

  public updateViewport(physicalWidth: number, physicalHeight: number): ViewportTransform {
    const width = Math.max(1, physicalWidth);
    const height = Math.max(1, physicalHeight);

    const scaleX = width / this.virtualWidth;
    const scaleY = height / this.virtualHeight;
    const baseScale = Math.min(scaleX, scaleY);
    const effectiveScale = baseScale * this.resolutionScale;

    const scaledWidth = this.virtualWidth * effectiveScale;
    const scaledHeight = this.virtualHeight * effectiveScale;

    const offsetX = Math.floor((width - scaledWidth) / 2);
    const offsetY = Math.floor((height - scaledHeight) / 2);

    this.transform = {
      scale: effectiveScale,
      offsetX,
      offsetY,
      viewportWidth: width,
      viewportHeight: height,
      virtualWidth: this.virtualWidth,
      virtualHeight: this.virtualHeight,
    };

    return this.transform;
  }

  public screenToVirtual(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.transform.offsetX) / this.transform.scale,
      y: (screenY - this.transform.offsetY) / this.transform.scale,
    };
  }

  public virtualToScreen(virtualX: number, virtualY: number): { x: number; y: number } {
    return {
      x: virtualX * this.transform.scale + this.transform.offsetX,
      y: virtualY * this.transform.scale + this.transform.offsetY,
    };
  }

  public setResolutionScale(scale: number): void {
    this.resolutionScale = Math.max(0.25, Math.min(2.0, scale));
  }

  public getTransform(): Readonly<ViewportTransform> {
    return this.transform;
  }

  public getVirtualWidth(): number {
    return this.virtualWidth;
  }

  public getVirtualHeight(): number {
    return this.virtualHeight;
  }
}
