import { create } from 'zustand';
import {
  type BackupItem,
  type BackupConfig,
  type BackupStats,
  type RestoreOperation,
  type BackupType,
  BackupFrequency
} from '../types/Backup';
import { backupService } from '../services/backupService';

interface BackupState {
  // State
  backups: BackupItem[];
  configs: BackupConfig[];
  restoreOperations: RestoreOperation[];
  stats: BackupStats | null;
  isLoading: boolean;
  selectedBackup: BackupItem | null;
  selectedConfig: BackupConfig | null;

  // Actions
  loadBackups: () => Promise<void>;
  loadBackupConfigs: () => Promise<void>;
  loadBackupStats: () => Promise<void>;

  // Backup operations
  createBackup: (type: BackupType, description?: string) => Promise<{ success: boolean; message?: string }>;
  deleteBackup: (id: string) => Promise<{ success: boolean; message?: string }>;
  downloadBackup: (id: string) => Promise<{ success: boolean; message?: string }>;
  restoreBackup: (backupId: string) => Promise<{ success: boolean; message?: string }>;

  // Configuration management
  createBackupConfig: (config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  updateBackupConfig: (id: string, updates: Partial<BackupConfig>) => Promise<{ success: boolean; message?: string }>;
  deleteBackupConfig: (id: string) => Promise<{ success: boolean; message?: string }>;

  // UI state
  setSelectedBackup: (backup: BackupItem | null) => void;
  setSelectedConfig: (config: BackupConfig | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useBackupStore = create<BackupState>((set, get) => ({
  // Initial state
  backups: [],
  configs: [],
  restoreOperations: [],
  stats: null,
  isLoading: false,
  selectedBackup: null,
  selectedConfig: null,

  // Load backups
  loadBackups: async () => {
    set({ isLoading: true });
    try {
      const backups = await backupService.getBackups();
      set({ backups, isLoading: false });
    } catch (error) {
      console.error('Error loading backups:', error);
      set({ isLoading: false });
    }
  },

  // Load backup configurations
  loadBackupConfigs: async () => {
    try {
      const configs = await backupService.getBackupConfigs();
      set({ configs });
    } catch (error) {
      console.error('Error loading backup configs:', error);
    }
  },

  // Load backup statistics
  loadBackupStats: async () => {
    try {
      const stats = await backupService.getBackupStats();
      set({ stats });
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  },

  // Create backup
  createBackup: async (type: BackupType, description?: string) => {
    set({ isLoading: true });
    try {
      const result = await backupService.createBackup(type, description);

      if (result.success) {
        // Reload backups and stats
        await get().loadBackups();
        await get().loadBackupStats();
      }

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Error creating backup:', error);
      set({ isLoading: false });
      return { success: false, message: 'Erro ao criar backup' };
    }
  },

  // Delete backup
  deleteBackup: async (id: string) => {
    try {
      const result = await backupService.deleteBackup(id);

      if (result.success) {
        // Remove from local state
        const { backups } = get();
        const updatedBackups = backups.filter(b => b.id !== id);
        set({ backups: updatedBackups });

        // Reload stats
        await get().loadBackupStats();
      }

      return result;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return { success: false, message: 'Erro ao excluir backup' };
    }
  },

  // Download backup
  downloadBackup: async (id: string) => {
    try {
      const result = await backupService.downloadBackup(id);
      return result;
    } catch (error) {
      console.error('Error downloading backup:', error);
      return { success: false, message: 'Erro ao baixar backup' };
    }
  },

  // Restore backup
  restoreBackup: async (backupId: string) => {
    set({ isLoading: true });
    try {
      const result = await backupService.restoreBackup(backupId);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Error restoring backup:', error);
      set({ isLoading: false });
      return { success: false, message: 'Erro ao restaurar backup' };
    }
  },

  // Create backup configuration
  createBackupConfig: async (config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await backupService.createBackupConfig(config);

      if (result.success) {
        // Reload configurations
        await get().loadBackupConfigs();
      }

      return result;
    } catch (error) {
      console.error('Error creating backup config:', error);
      return { success: false, message: 'Erro ao criar configuração de backup' };
    }
  },

  // Update backup configuration
  updateBackupConfig: async (id: string, updates: Partial<BackupConfig>) => {
    try {
      const result = await backupService.updateBackupConfig(id, updates);

      if (result.success) {
        // Update local state
        const { configs } = get();
        const updatedConfigs = configs.map(config =>
          config.id === id ? { ...config, ...updates, updatedAt: new Date() } : config
        );
        set({ configs: updatedConfigs });
      }

      return result;
    } catch (error) {
      console.error('Error updating backup config:', error);
      return { success: false, message: 'Erro ao atualizar configuração' };
    }
  },

  // Delete backup configuration
  deleteBackupConfig: async (id: string) => {
    try {
      const result = await backupService.deleteBackupConfig(id);

      if (result.success) {
        // Remove from local state
        const { configs } = get();
        const updatedConfigs = configs.filter(c => c.id !== id);
        set({ configs: updatedConfigs });
      }

      return result;
    } catch (error) {
      console.error('Error deleting backup config:', error);
      return { success: false, message: 'Erro ao excluir configuração' };
    }
  },

  // UI state management
  setSelectedBackup: (backup: BackupItem | null) => {
    set({ selectedBackup: backup });
  },

  setSelectedConfig: (config: BackupConfig | null) => {
    set({ selectedConfig: config });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
