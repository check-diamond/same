export type BackupType = 'full' | 'incremental' | 'vendas' | 'estoque' | 'configuracoes';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed';
export type BackupFrequency = 'manual' | 'daily' | 'weekly' | 'monthly';

export interface BackupItem {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  createdAt: Date;
  completedAt?: Date;
  size: number; // in bytes
  downloadUrl?: string;
  errorMessage?: string;
  progress: number; // 0-100
  userId: string;
  description?: string;
}

export interface BackupConfig {
  id: string;
  name: string;
  type: BackupType;
  frequency: BackupFrequency;
  isEnabled: boolean;
  scheduleTime?: string; // HH:mm format
  retentionDays: number;
  includeFiles: boolean;
  compression: boolean;
  encryption: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface BackupData {
  metadata: {
    version: string;
    createdAt: string;
    type: BackupType;
    checksum: string;
    size: number;
  };
  vendas?: any[];
  estoque?: any[];
  revendedores?: any[];
  configuracoes?: any;
  pixConfig?: any;
  users?: any[];
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: Date;
  nextScheduledBackup?: Date;
  successRate: number;
  avgBackupTime: number; // in seconds
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
}

export interface RestoreOperation {
  id: string;
  backupId: string;
  status: BackupStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  userId: string;
  errorMessage?: string;
  itemsRestored: number;
  totalItems: number;
}

export interface BackupSchedule {
  id: string;
  configId: string;
  scheduledAt: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  backupId?: string;
  errorMessage?: string;
}

export const BACKUP_TYPE_LABELS: Record<BackupType, string> = {
  full: 'Backup Completo',
  incremental: 'Backup Incremental',
  vendas: 'Apenas Vendas',
  estoque: 'Apenas Estoque',
  configuracoes: 'Apenas Configurações',
};

export const BACKUP_TYPE_DESCRIPTIONS: Record<BackupType, string> = {
  full: 'Backup completo de todos os dados do sistema',
  incremental: 'Backup apenas das alterações desde o último backup',
  vendas: 'Backup específico dos dados de vendas e transações',
  estoque: 'Backup específico dos dados de estoque e produtos',
  configuracoes: 'Backup das configurações do sistema e PIX',
};

export const FREQUENCY_LABELS: Record<BackupFrequency, string> = {
  manual: 'Manual',
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export interface BackupError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface BackupNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  backupId?: string;
  timestamp: Date;
  read: boolean;
}
