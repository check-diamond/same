import {
  type BackupItem,
  type BackupConfig,
  type BackupData,
  type BackupStats,
  type RestoreOperation,
  type BackupType,
  BackupFrequency,
  BackupStatus
} from '../types/Backup';
import { useDataStore } from '../stores/data';

class BackupService {
  private backups: BackupItem[] = [];
  private configs: BackupConfig[] = [];
  private restoreOperations: RestoreOperation[] = [];
  private scheduleIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadInitialData();
    this.startScheduleManager();
  }

  private loadInitialData() {
    // Load existing backups from localStorage
    const savedBackups = localStorage.getItem('check-diamond-backups');
    if (savedBackups) {
      try {
        this.backups = JSON.parse(savedBackups).map((backup: any) => ({
          ...backup,
          createdAt: new Date(backup.createdAt),
          completedAt: backup.completedAt ? new Date(backup.completedAt) : undefined,
        }));
      } catch (error) {
        console.error('Error loading backups:', error);
      }
    }

    // Load backup configurations
    const savedConfigs = localStorage.getItem('check-diamond-backup-configs');
    if (savedConfigs) {
      try {
        this.configs = JSON.parse(savedConfigs).map((config: any) => ({
          ...config,
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
          lastRunAt: config.lastRunAt ? new Date(config.lastRunAt) : undefined,
          nextRunAt: config.nextRunAt ? new Date(config.nextRunAt) : undefined,
        }));
      } catch (error) {
        console.error('Error loading backup configs:', error);
      }
    }
  }

  private saveData() {
    localStorage.setItem('check-diamond-backups', JSON.stringify(this.backups));
    localStorage.setItem('check-diamond-backup-configs', JSON.stringify(this.configs));
  }

  private startScheduleManager() {
    // Check for scheduled backups every minute
    setInterval(() => {
      this.checkScheduledBackups();
    }, 60000);
  }

  private async checkScheduledBackups() {
    const now = new Date();

    for (const config of this.configs) {
      if (!config.isEnabled || !config.nextRunAt) continue;

      if (config.nextRunAt <= now) {
        console.log(`Running scheduled backup: ${config.name}`);
        await this.createBackup(config.type, `Backup automático - ${config.name}`);
        this.updateNextRunTime(config);
      }
    }
  }

  private updateNextRunTime(config: BackupConfig) {
    const now = new Date();
    const nextRun = new Date(now);

    switch (config.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        return; // Manual backups don't have next run time
    }

    if (config.scheduleTime) {
      const [hours, minutes] = config.scheduleTime.split(':');
      nextRun.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);
    }

    config.nextRunAt = nextRun;
    config.lastRunAt = now;
    this.saveData();
  }

  // Create a new backup
  async createBackup(type: BackupType, description?: string): Promise<{ success: boolean; backupId?: string; message?: string }> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {

      const backup: BackupItem = {
        id: backupId,
        name: description || `Backup ${type} - ${new Date().toLocaleDateString('pt-BR')}`,
        type,
        status: 'running',
        createdAt: new Date(),
        size: 0,
        progress: 0,
        userId: 'current-user', // Should get from userStore
        description,
      };

      this.backups.unshift(backup);
      this.saveData();

      // Simulate backup process
      const backupData = await this.collectBackupData(type);

      // Simulate progress updates
      for (let progress = 0; progress <= 100; progress += 20) {
        backup.progress = progress;
        this.saveData();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Generate backup file
      const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      backup.size = backupBlob.size;
      backup.status = 'completed';
      backup.completedAt = new Date();
      backup.downloadUrl = URL.createObjectURL(backupBlob);
      backup.progress = 100;

      this.saveData();
      this.cleanupOldBackups();

      return { success: true, backupId };
    } catch (error) {
      console.error('Backup error:', error);

      // Update backup status to failed
      const backup = this.backups.find(b => b.id === backupId);
      if (backup) {
        backup.status = 'failed';
        backup.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        this.saveData();
      }

      return { success: false, message: 'Erro ao criar backup' };
    }
  }

  private async collectBackupData(type: BackupType): Promise<BackupData> {
    const dataStore = useDataStore.getState();

    const metadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      type,
      checksum: Math.random().toString(36).substr(2, 16),
      size: 0,
    };

    const backupData: BackupData = { metadata };

    switch (type) {
      case 'full':
        backupData.vendas = dataStore.vendas || [];
        backupData.estoque = Array.isArray(dataStore.estoque) ? dataStore.estoque : (dataStore.estoque ? [dataStore.estoque] : []);
        backupData.revendedores = dataStore.revendedores || [];
        backupData.configuracoes = { /* PIX configs */ };
        break;

      case 'vendas':
        backupData.vendas = dataStore.vendas || [];
        break;

      case 'estoque':
        backupData.estoque = Array.isArray(dataStore.estoque) ? dataStore.estoque : (dataStore.estoque ? [dataStore.estoque] : []);
        break;

      case 'configuracoes':
        backupData.configuracoes = { /* PIX configs */ };
        break;

      case 'incremental':
        // Logic for incremental backup (only changes since last backup)
        const lastBackup = this.getLastSuccessfulBackup();
        if (lastBackup) {
          // Compare and get only changes
          backupData.vendas = this.getChangedItems(dataStore.vendas || [], lastBackup.completedAt!);
          backupData.estoque = this.getChangedItems(Array.isArray(dataStore.estoque) ? dataStore.estoque : (dataStore.estoque ? [dataStore.estoque] : []), lastBackup.completedAt!);
        } else {
          // No previous backup, do full backup
          backupData.vendas = dataStore.vendas || [];
          backupData.estoque = Array.isArray(dataStore.estoque) ? dataStore.estoque : (dataStore.estoque ? [dataStore.estoque] : []);
          backupData.revendedores = dataStore.revendedores || [];
        }
        break;
    }

    metadata.size = JSON.stringify(backupData).length;
    return backupData;
  }

  private getChangedItems(items: any[], since: Date): any[] {
    return items.filter(item => {
      const itemDate = new Date(item.updatedAt || item.createdAt || item.data);
      return itemDate > since;
    });
  }

  private getLastSuccessfulBackup(): BackupItem | null {
    return this.backups
      .filter(b => b.status === 'completed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null;
  }

  private cleanupOldBackups() {
    const retentionDays = 30; // Default retention
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.backups = this.backups.filter(backup => {
      if (backup.createdAt < cutoffDate) {
        // Revoke blob URL to free memory
        if (backup.downloadUrl) {
          URL.revokeObjectURL(backup.downloadUrl);
        }
        return false;
      }
      return true;
    });

    this.saveData();
  }

  // Get all backups
  async getBackups(): Promise<BackupItem[]> {
    return [...this.backups];
  }

  // Get backup by ID
  async getBackup(id: string): Promise<BackupItem | null> {
    return this.backups.find(b => b.id === id) || null;
  }

  // Delete backup
  async deleteBackup(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const index = this.backups.findIndex(b => b.id === id);
      if (index === -1) {
        return { success: false, message: 'Backup não encontrado' };
      }

      const backup = this.backups[index];

      // Revoke blob URL if exists
      if (backup.downloadUrl) {
        URL.revokeObjectURL(backup.downloadUrl);
      }

      this.backups.splice(index, 1);
      this.saveData();

      return { success: true };
    } catch (error) {
      console.error('Delete backup error:', error);
      return { success: false, message: 'Erro ao excluir backup' };
    }
  }

  // Download backup
  async downloadBackup(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const backup = await this.getBackup(id);
      if (!backup || !backup.downloadUrl) {
        return { success: false, message: 'Backup não encontrado ou não disponível' };
      }

      // Create download link
      const link = document.createElement('a');
      link.href = backup.downloadUrl;
      link.download = `${backup.name.replace(/[^a-z0-9]/gi, '_')}_${backup.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Download backup error:', error);
      return { success: false, message: 'Erro ao baixar backup' };
    }
  }

  // Restore from backup
  async restoreBackup(backupId: string): Promise<{ success: boolean; operationId?: string; message?: string }> {
    const operationId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const backup = await this.getBackup(backupId);
      if (!backup || backup.status !== 'completed') {
        return { success: false, message: 'Backup não encontrado ou não concluído' };
      }

      const operation: RestoreOperation = {
        id: operationId,
        backupId,
        status: 'running',
        progress: 0,
        startedAt: new Date(),
        userId: 'current-user',
        itemsRestored: 0,
        totalItems: 0,
      };

      this.restoreOperations.unshift(operation);

      // Simulate restore process
      if (backup.downloadUrl) {
        const response = await fetch(backup.downloadUrl);
        const backupData: BackupData = await response.json();

        const dataStore = useDataStore.getState();

        // Restore data based on backup type
        if (backupData.vendas) {
          // dataStore.setVendas(backupData.vendas); // Would need to implement setters in dataStore
          operation.itemsRestored += backupData.vendas.length;
        }

        if (backupData.estoque) {
          // dataStore.setEstoque(backupData.estoque); // Would need to implement setters in dataStore
          operation.itemsRestored += backupData.estoque.length;
        }

        if (backupData.revendedores) {
          // dataStore.setRevendedores(backupData.revendedores); // Would need to implement setters in dataStore
          operation.itemsRestored += backupData.revendedores.length;
        }

        operation.status = 'completed';
        operation.completedAt = new Date();
        operation.progress = 100;
      }

      return { success: true, operationId };
    } catch (error) {
      console.error('Restore backup error:', error);

      const operation = this.restoreOperations.find(op => op.id === operationId);
      if (operation) {
        operation.status = 'failed';
        operation.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      }

      return { success: false, message: 'Erro ao restaurar backup' };
    }
  }

  // Get backup statistics
  async getBackupStats(): Promise<BackupStats> {
    const completedBackups = this.backups.filter(b => b.status === 'completed');
    const totalSize = completedBackups.reduce((sum, b) => sum + b.size, 0);
    const lastBackup = completedBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const successRate = this.backups.length > 0
      ? (completedBackups.length / this.backups.length) * 100
      : 0;

    const nextScheduled = this.configs
      .filter(c => c.isEnabled && c.nextRunAt)
      .map(c => c.nextRunAt!)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      totalBackups: this.backups.length,
      totalSize,
      lastBackup: lastBackup?.createdAt,
      nextScheduledBackup: nextScheduled,
      successRate,
      avgBackupTime: 5, // Mock average time in seconds
      storageUsed: totalSize,
      storageLimit: 100 * 1024 * 1024, // 100MB limit
    };
  }

  // Backup configuration management
  async createBackupConfig(config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; configId?: string; message?: string }> {
    try {
      const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newConfig: BackupConfig = {
        ...config,
        id: configId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Calculate next run time
      if (config.frequency !== 'manual' && config.scheduleTime) {
        const now = new Date();
        const nextRun = new Date(now);
        const [hours, minutes] = config.scheduleTime.split(':');
        nextRun.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }

        newConfig.nextRunAt = nextRun;
      }

      this.configs.unshift(newConfig);
      this.saveData();

      return { success: true, configId };
    } catch (error) {
      console.error('Create backup config error:', error);
      return { success: false, message: 'Erro ao criar configuração de backup' };
    }
  }

  // Get backup configurations
  async getBackupConfigs(): Promise<BackupConfig[]> {
    return [...this.configs];
  }

  // Update backup configuration
  async updateBackupConfig(id: string, updates: Partial<BackupConfig>): Promise<{ success: boolean; message?: string }> {
    try {
      const index = this.configs.findIndex(c => c.id === id);
      if (index === -1) {
        return { success: false, message: 'Configuração não encontrada' };
      }

      this.configs[index] = {
        ...this.configs[index],
        ...updates,
        updatedAt: new Date(),
      };

      this.saveData();
      return { success: true };
    } catch (error) {
      console.error('Update backup config error:', error);
      return { success: false, message: 'Erro ao atualizar configuração' };
    }
  }

  // Delete backup configuration
  async deleteBackupConfig(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const index = this.configs.findIndex(c => c.id === id);
      if (index === -1) {
        return { success: false, message: 'Configuração não encontrada' };
      }

      this.configs.splice(index, 1);
      this.saveData();

      return { success: true };
    } catch (error) {
      console.error('Delete backup config error:', error);
      return { success: false, message: 'Erro ao excluir configuração' };
    }
  }
}

export const backupService = new BackupService();
