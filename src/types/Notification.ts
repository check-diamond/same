export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationCategory = 'order' | 'payment' | 'system' | 'backup' | 'user' | 'general';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
  autoClose?: number; // milliseconds
  persistent?: boolean;
  sound?: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  categories: Record<NotificationCategory, {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sound: boolean;
  }>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  createdAt: Date;
}

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
  last24Hours: number;
  avgResponseTime: number; // milliseconds
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Aviso',
  info: 'Informação',
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: 'Pedidos',
  payment: 'Pagamentos',
  system: 'Sistema',
  backup: 'Backups',
  user: 'Usuários',
  general: 'Geral',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

// Event types for real-time notifications
export interface NotificationEvent {
  type: 'new_order' | 'payment_confirmed' | 'payment_failed' | 'backup_completed' | 'system_alert' | 'user_action';
  data: any;
  timestamp: Date;
}

// Real-time connection status
export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat?: Date;
  reconnectAttempts: number;
  error?: string;
}

// Notification queue for offline scenarios
export interface NotificationQueue {
  notifications: Notification[];
  maxSize: number;
  retryAttempts: number;
}
