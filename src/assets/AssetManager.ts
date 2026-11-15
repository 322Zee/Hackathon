import { Assets, AssetsManifest, Texture } from 'pixi.js';
import { IAssetSystem } from '../systems/interfaces/CoreSystemInterfaces';
import { SystemId } from '../systems/interfaces/IGameSystem';
import { AssetType, AssetLoadingState, AssetRecord } from './AssetType';
import { Logger } from '../core/logging/Logger';
import { EventBus } from '../core/EventBus';

export type LoadProgressCallback = (progress: number, bundleName: string) => void;

export class AssetManager implements IAssetSystem {
  public readonly id = SystemId.ASSETS;
  public readonly priority = 20; // Initializes early

  private eventBus?: EventBus;
  private loadedBundles: Set<string> = new Set();
  private inFlightLoads: Map<string, Promise<any>> = new Map();
  private assetRecords: Map<string, AssetRecord> = new Map();
  private isManifestInitialized: boolean = false;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public async initialize(): Promise<void> {
    if (this.isManifestInitialized) return;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.isManifestInitialized = true;
      Logger.info('ASSET_MANAGER', 'Headless environment detected; skipping DOM-based asset detection.');
      return;
    }

    Logger.info('ASSET_MANAGER', 'Initializing PixiJS Assets system...');

    const defaultManifest: AssetsManifest = {
      bundles: [
        { name: 'core', assets: [] },
        { name: 'audio', assets: [] },
        { name: 'textures', assets: [] },
        { name: 'particles', assets: [] },
        { name: 'environments', assets: [] },
        { name: 'ui', assets: [] },
        { name: 'shaders', assets: [] },
        { name: 'data', assets: [] },
      ],
    };

    try {
      await Assets.init({ manifest: defaultManifest });
      this.isManifestInitialized = true;
      Logger.info('ASSET_MANAGER', 'Assets system initialized successfully.');
    } catch (err) {
      Logger.error('ASSET_MANAGER', 'Failed to initialize Assets manifest:', err);
    }
  }

  public registerAsset(key: string, type: AssetType, source: string): void {
    if (this.assetRecords.has(key)) {
      Logger.warn('ASSET_MANAGER', `Asset "${key}" is already registered. Overwriting record.`);
    }

    this.assetRecords.set(key, {
      key,
      type,
      source,
      state: 'UNLOADED',
    });
  }

  public async loadAsset<T = any>(key: string): Promise<T | undefined> {
    const record = this.assetRecords.get(key);
    if (!record) {
      Logger.warn('ASSET_MANAGER', `Cannot load unregistered asset: "${key}"`);
      return undefined;
    }

    if (record.state === 'LOADED' && record.data) {
      return record.data;
    }

    // Deduplicate in-flight requests
    if (this.inFlightLoads.has(key)) {
      return this.inFlightLoads.get(key);
    }

    record.state = 'LOADING';
    const loadPromise = (async () => {
      try {
        Logger.info('ASSET_MANAGER', `Loading asset [${record.type}] "${key}" from ${record.source}...`);
        const data = await Assets.load(record.source);
        record.state = 'LOADED';
        record.data = data;
        return data as T;
      } catch (err: any) {
        record.state = 'FAILED';
        record.error = err;
        Logger.error('ASSET_MANAGER', `Failed to load asset "${key}":`, err);
        return this.getFallbackAsset<T>(record.type);
      } finally {
        this.inFlightLoads.delete(key);
      }
    })();

    this.inFlightLoads.set(key, loadPromise);
    return loadPromise;
  }

  public async loadBundle(bundleName: string, onProgress?: (ratio: number) => void): Promise<void> {
    if (this.loadedBundles.has(bundleName)) {
      if (onProgress) onProgress(1.0);
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.loadedBundles.add(bundleName);
      if (onProgress) onProgress(1.0);
      if (this.eventBus) this.eventBus.emit('assets:loaded', { bundle: bundleName });
      return;
    }

    Logger.info('ASSET_MANAGER', `Beginning load for bundle "${bundleName}"...`);

    try {
      await Assets.loadBundle(bundleName, (progress: number) => {
        if (onProgress) {
          onProgress(progress);
        }
        if (this.eventBus) {
          this.eventBus.emit('assets:progress', { bundle: bundleName, progress });
        }
      });

      this.loadedBundles.add(bundleName);
      Logger.info('ASSET_MANAGER', `Bundle "${bundleName}" loaded successfully.`);

      if (this.eventBus) {
        this.eventBus.emit('assets:loaded', { bundle: bundleName });
      }
    } catch (err) {
      Logger.error('ASSET_MANAGER', `Error loading bundle "${bundleName}":`, err);
      this.loadedBundles.add(bundleName);
    }
  }

  public isBundleLoaded(bundleName: string): boolean {
    return this.loadedBundles.has(bundleName);
  }

  public getAsset<T = any>(key: string): T | undefined {
    const record = this.assetRecords.get(key);
    if (record && record.data) {
      return record.data;
    }
    return Assets.get<T>(key);
  }

  public getAssetState(key: string): AssetLoadingState {
    const record = this.assetRecords.get(key);
    return record ? record.state : 'UNLOADED';
  }

  public async unloadBundle(bundleName: string): Promise<void> {
    if (this.loadedBundles.has(bundleName)) {
      await Assets.unloadBundle(bundleName);
      this.loadedBundles.delete(bundleName);
      Logger.info('ASSET_MANAGER', `Bundle "${bundleName}" unloaded.`);
    }
  }

  public async shutdown(): Promise<void> {
    this.assetRecords.clear();
    this.inFlightLoads.clear();
    this.loadedBundles.clear();
    Logger.info('ASSET_MANAGER', 'AssetManager shutdown.');
  }

  private getFallbackAsset<T>(type: AssetType): T | undefined {
    if (
      type === AssetType.IMAGE ||
      type === AssetType.PARTICLE_TEXTURE ||
      type === AssetType.ENVIRONMENT_TEXTURE ||
      type === AssetType.UI_ASSET
    ) {
      // Fallback to PixiJS white texture
      return Texture.WHITE as unknown as T;
    }
    return undefined;
  }
}
