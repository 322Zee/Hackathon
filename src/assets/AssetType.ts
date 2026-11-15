export enum AssetType {
  IMAGE = 'IMAGE',
  SPRITESHEET = 'SPRITESHEET',
  FONT = 'FONT',
  AUDIO = 'AUDIO',
  PARTICLE_TEXTURE = 'PARTICLE_TEXTURE',
  ENVIRONMENT_TEXTURE = 'ENVIRONMENT_TEXTURE',
  UI_ASSET = 'UI_ASSET',
  SHADER_RESOURCE = 'SHADER_RESOURCE',
}

export type AssetLoadingState = 'UNLOADED' | 'LOADING' | 'LOADED' | 'FAILED';

export interface AssetRecord<T = any> {
  key: string;
  type: AssetType;
  source: string;
  state: AssetLoadingState;
  data?: T;
  error?: Error;
}
