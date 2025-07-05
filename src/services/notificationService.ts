import {
  type Notification,
  type NotificationSettings,
  type NotificationTemplate,
  type NotificationEvent,
  type NotificationCategory,
  NotificationType,
  NotificationPriority,
  type ConnectionStatus,
  type NotificationQueue
} from '../types/Notification';

class NotificationService {
  private notifications: Notification[] = [];
  private settings: NotificationSettings | null = null;
  private templates: NotificationTemplate[] = [];
  private eventSource: EventSource | null = null;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    reconnectAttempts: 0,
  };
  private listeners: Set<(notification: Notification) => void> = new Set();
  private queue: NotificationQueue = {
    notifications: [],
    maxSize: 100,
    retryAttempts: 0,
  };
  private audio: HTMLAudioElement | null = null;

  constructor() {
    this.loadData();
    this.initializeAudio();
    this.initializeRealTimeConnection();
    this.startHeartbeat();
  }

  private loadData() {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('check-diamond-notifications');
    if (savedNotifications) {
      try {
        this.notifications = JSON.parse(savedNotifications).map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
        }));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }

    // Load settings
    const savedSettings = localStorage.getItem('check-diamond-notification-settings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }

    // Initialize default settings if none exist
    if (!this.settings) {
      this.settings = this.createDefaultSettings();
    }

    // Load templates
    this.initializeDefaultTemplates();
  }

  private saveData() {
    localStorage.setItem('check-diamond-notifications', JSON.stringify(this.notifications));
    if (this.settings) {
      localStorage.setItem('check-diamond-notification-settings', JSON.stringify(this.settings));
    }
  }

  private createDefaultSettings(): NotificationSettings {
    return {
      userId: 'current-user',
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      categories: {
        order: { enabled: true, email: true, push: true, sound: true },
        payment: { enabled: true, email: true, push: true, sound: true },
        system: { enabled: true, email: false, push: true, sound: false },
        backup: { enabled: true, email: false, push: false, sound: false },
        user: { enabled: true, email: false, push: true, sound: false },
        general: { enabled: true, email: false, push: true, sound: false },
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private initializeDefaultTemplates() {
    this.templates = [
      {
        id: 'new_order',
        category: 'order',
        name: 'Novo Pedido',
        title: 'Novo pedido recebido',
        message: 'Um novo pedido de R$ {{amount}} foi recebido de {{customer}}',
        type: 'info',
        priority: 'medium',
        variables: ['amount', 'customer'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'payment_confirmed',
        category: 'payment',
        name: 'Pagamento Confirmado',
        title: 'Pagamento confirmado',
        message: 'Pagamento de R$ {{amount}} foi confirmado via PIX',
        type: 'success',
        priority: 'high',
        variables: ['amount'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'payment_failed',
        category: 'payment',
        name: 'Pagamento Falhou',
        title: 'Falha no pagamento',
        message: 'Pagamento de R$ {{amount}} falhou: {{reason}}',
        type: 'error',
        priority: 'high',
        variables: ['amount', 'reason'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'backup_completed',
        category: 'backup',
        name: 'Backup Concluído',
        title: 'Backup concluído',
        message: 'Backup {{type}} foi concluído com sucesso',
        type: 'success',
        priority: 'low',
        variables: ['type'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private initializeAudio() {
    try {
      // Create notification sound (you can replace with actual audio file)
      this.audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA...');
      this.audio.volume = 0.3;
    } catch (error) {
      console.warn('Could not initialize notification audio:', error);
    }
  }

  private initializeRealTimeConnection() {
    // Simulate real-time connection with EventSource
    try {
      // In a real app, this would connect to your backend SSE endpoint
      this.connectionStatus.connected = true;
      this.connectionStatus.lastHeartbeat = new Date();

      // Simulate incoming events
      this.simulateRealTimeEvents();
    } catch (error) {
      console.error('Failed to establish real-time connection:', error);
      this.handleConnectionError(error);
    }
  }

  private simulateRealTimeEvents() {
    // Simulate periodic events for demo purposes
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        this.simulateEvent();
      }
    }, 30000);
  }

  private simulateEvent() {
    const events = [
      { type: 'new_order', data: { amount: 150.00, customer: 'Cliente Demo' } },
      { type: 'payment_confirmed', data: { amount: 89.90 } },
      { type: 'backup_completed', data: { type: 'automático' } },
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    this.handleRealtimeEvent(randomEvent as NotificationEvent);
  }

  private startHeartbeat() {
    setInterval(() => {
      if (this.connectionStatus.connected) {
        this.connectionStatus.lastHeartbeat = new Date();
      }
    }, 30000); // Heartbeat every 30 seconds
  }

  private handleConnectionError(error: any) {
    this.connectionStatus.connected = false;
    this.connectionStatus.error = error.message;
    this.connectionStatus.reconnectAttempts++;

    // Try to reconnect after delay
    setTimeout(() => {
      if (this.connectionStatus.reconnectAttempts < 5) {
        this.initializeRealTimeConnection();
      }
    }, Math.pow(2, this.connectionStatus.reconnectAttempts) * 1000);
  }

  private handleRealtimeEvent(event: NotificationEvent) {
    const template = this.templates.find(t => t.id === event.type);
    if (!template || !template.isActive) return;

    const notification = this.createNotificationFromTemplate(template, event.data);
    this.addNotification(notification);
  }

  private createNotificationFromTemplate(template: NotificationTemplate, data: any): Notification {
    let title = template.title;
    let message = template.message;

    // Replace variables in template
    template.variables.forEach(variable => {
      const value = data[variable] || '';
      title = title.replace(`{{${variable}}}`, value);
      message = message.replace(`{{${variable}}}`, value);
    });

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      category: template.category,
      priority: template.priority,
      title,
      message,
      timestamp: new Date(),
      read: false,
      metadata: data,
      autoClose: template.priority === 'low' ? 5000 : undefined,
    };
  }

  // Public methods

  // Add notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const fullNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Check if category is enabled
    if (!this.settings?.categories[notification.category]?.enabled) {
      return fullNotification.id;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      this.queue.notifications.push(fullNotification);
      return fullNotification.id;
    }

    this.notifications.unshift(fullNotification);

    // Limit notifications list
    if (this.notifications.length > 1000) {
      this.notifications = this.notifications.slice(0, 1000);
    }

    this.saveData();

    // Play sound if enabled
    if (this.settings?.soundEnabled && this.settings.categories[notification.category]?.sound) {
      this.playNotificationSound();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(fullNotification));

    return fullNotification.id;
  }

  // Quick notification methods
  success(title: string, message: string, category: NotificationCategory = 'general') {
    return this.addNotification({
      type: 'success',
      category,
      priority: 'medium',
      title,
      message,
    });
  }

  error(title: string, message: string, category: NotificationCategory = 'general') {
    return this.addNotification({
      type: 'error',
      category,
      priority: 'high',
      title,
      message,
      persistent: true,
    });
  }

  warning(title: string, message: string, category: NotificationCategory = 'general') {
    return this.addNotification({
      type: 'warning',
      category,
      priority: 'medium',
      title,
      message,
    });
  }

  info(title: string, message: string, category: NotificationCategory = 'general') {
    return this.addNotification({
      type: 'info',
      category,
      priority: 'low',
      title,
      message,
      autoClose: 5000,
    });
  }

  // Get notifications
  getNotifications(limit?: number): Notification[] {
    const sorted = [...this.notifications].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Mark notification as read
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveData();
      return true;
    }
    return false;
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveData();
  }

  // Delete notification
  deleteNotification(notificationId: string): boolean {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.saveData();
  }

  // Subscribe to notifications
  subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Get notification statistics
  getStats(): any {
    const unread = this.getUnreadNotifications().length;
    const last24Hours = this.notifications.filter(n =>
      Date.now() - n.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length;

    const byCategory = this.notifications.reduce((acc, notif) => {
      acc[notif.category] = (acc[notif.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = this.notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.notifications.length,
      unread,
      byCategory,
      byType,
      last24Hours,
      avgResponseTime: 2000, // Mock value
    };
  }

  // Settings management
  getSettings(): NotificationSettings | null {
    return this.settings;
  }

  updateSettings(updates: Partial<NotificationSettings>): void {
    if (this.settings) {
      this.settings = {
        ...this.settings,
        ...updates,
        updatedAt: new Date(),
      };
      this.saveData();
    }
  }

  // Connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Private utility methods
  private isQuietHours(): boolean {
    if (!this.settings?.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private playNotificationSound(): void {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }

  // Process queued notifications (called when quiet hours end)
  processQueue(): void {
    const queuedNotifications = [...this.queue.notifications];
    this.queue.notifications = [];

    queuedNotifications.forEach(notification => {
      this.notifications.unshift(notification);
      this.listeners.forEach(listener => listener(notification));
    });

    this.saveData();
  }
}

export const notificationService = new NotificationService();
