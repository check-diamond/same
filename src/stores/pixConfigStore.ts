import { create } from 'zustand';
import type { PixAdvancedConfig } from '@/types/PixAdvancedConfig';
import { PixServiceClass } from '@/services/PixServiceClass';

interface PixConfigState {
  config: PixAdvancedConfig;
  updateAdvancedConfig: (newConfig: PixAdvancedConfig) => void;
}

const pixService = new PixServiceClass();

export const usePixConfigStore = create<PixConfigState>((set) => ({
  config: pixService.getConfig(),
  updateAdvancedConfig: (newConfig) => {
    pixService.updateAdvancedConfig(newConfig);
    set({ config: pixService.getConfig() });
  },
}));
