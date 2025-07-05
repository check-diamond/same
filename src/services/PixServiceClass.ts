import type { PixAdvancedConfig } from '@/types/PixAdvancedConfig';

export class PixServiceClass {
  private config: PixAdvancedConfig = {};

  constructor(config?: PixAdvancedConfig) {
    if (config) this.config = config;
  }

  updateAdvancedConfig = (newConfig: PixAdvancedConfig) => {
    this.config = { ...this.config, ...newConfig };
  };

  getConfig = (): PixAdvancedConfig => {
    return this.config;
  };
}
