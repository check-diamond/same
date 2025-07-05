import { create } from 'zustand';
import {
  type Notification,
  type NotificationSettings,
  type NotificationCategory,
  NotificationPriority,
  NotificationType,
  type ConnectionStatus
} from '../types/Notification';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  connectionStatus: ConnectionStatus;

  // UI state
  showToasts: boolean;
  maxToasts: number;
  activeToasts: Notification[];

  // Actions
  loadNotifications: () => Promise<void>;
  loadSettings: () => Promise<void>;

  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAll: () => void;

  // Quick notification methods
  success: (title: string, message: string, category?: NotificationCategory) => string;
  error: (title: string, message: string, category?: NotificationCategory) => string;
  warning: (title: string, message: string, category?: NotificationCategory) => string;
  info: (title: string, message: string, category?: NotificationCategory) => string;

  // Settings
  updateSettings: (updates: Partial<NotificationSettings>) => void;

  // Toast management
  showToast: (notification: Notification) => void;
  hideToast: (notificationId: string) => void;
  clearToasts: () => void;

  // Connection
  refreshConnectionStatus: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  settings: null,
  connectionStatus: {
    connected: false,
    reconnectAttempts: 0,
  },
  showToasts: true,
  maxToasts: 5,
  activeToasts: [],

  // Load notifications
  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = notificationService.getNotifications();
      const unreadCount = notificationService.getUnreadNotifications().length;

      set({
        notifications,
        unreadCount,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      set({ isLoading: false });
    }
  },

  // Load settings
  loadSettings: async () => {
    try {
      const settings = notificationService.getSettings();
      const connectionStatus = notificationService.getConnectionStatus();

      set({ settings, connectionStatus });
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  },

  // Add notification
  addNotification: (notification) => {
    const id = notificationService.addNotification(notification);

    // Refresh local state
    const notifications = notificationService.getNotifications();
    const unreadCount = notificationService.getUnreadNotifications().length;
    const newNotification = notifications.find(n => n.id === id);

    set({ notifications, unreadCount });

    // Show toast if enabled and notification found
    if (newNotification && get().showToasts) {
      get().showToast(newNotification);
    }

    return id;
  },

  // Mark as read
  markAsRead: (notificationId: string) => {
    notificationService.markAsRead(notificationId);

    const { notifications } = get();
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    const unreadCount = updatedNotifications.filter(n => !n.read).length;

    set({ notifications: updatedNotifications, unreadCount });
  },

  // Mark all as read
  markAllAsRead: () => {
    notificationService.markAllAsRead();

    const { notifications } = get();
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));

    set({ notifications: updatedNotifications, unreadCount: 0 });
  },

  // Delete notification
  deleteNotification: (notificationId: string) => {
    notificationService.deleteNotification(notificationId);

    const { notifications } = get();
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    const unreadCount = updatedNotifications.filter(n => !n.read).length;

    set({ notifications: updatedNotifications, unreadCount });

    // Also remove from toasts
    get().hideToast(notificationId);
  },

  // Clear all notifications
  clearAll: () => {
    notificationService.clearAll();
    set({ notifications: [], unreadCount: 0 });
    get().clearToasts();
  },

  // Quick notification methods
  success: (title: string, message: string, category: NotificationCategory = 'general') => {
    return get().addNotification({
      type: 'success',
      category,
      priority: 'medium',
      title,
      message,
    });
  },

  error: (title: string, message: string, category: NotificationCategory = 'general') => {
    return get().addNotification({
      type: 'error',
      category,
      priority: 'high',
      title,
      message,
      persistent: true,
    });
  },

  warning: (title: string, message: string, category: NotificationCategory = 'general') => {
    return get().addNotification({
      type: 'warning',
      category,
      priority: 'medium',
      title,
      message,
    });
  },

  info: (title: string, message: string, category: NotificationCategory = 'general') => {
    return get().addNotification({
      type: 'info',
      category,
      priority: 'low',
      title,
      message,
      autoClose: 5000,
    });
  },

  // Update settings
  updateSettings: (updates: Partial<NotificationSettings>) => {
    notificationService.updateSettings(updates);

    const { settings } = get();
    if (settings) {
      set({
        settings: {
          ...settings,
          ...updates,
          updatedAt: new Date()
        }
      });
    }
  },

  // Toast management
  showToast: (notification: Notification) => {
    const { activeToasts, maxToasts } = get();

    // Add new toast
    let newToasts = [notification, ...activeToasts];

    // Limit number of toasts
    if (newToasts.length > maxToasts) {
      newToasts = newToasts.slice(0, maxToasts);
    }

    set({ activeToasts: newToasts });

    // Auto-remove toast if specified
    if (notification.autoClose) {
      setTimeout(() => {
        get().hideToast(notification.id);
      }, notification.autoClose);
    }
  },

  hideToast: (notificationId: string) => {
    const { activeToasts } = get();
    const updatedToasts = activeToasts.filter(toast => toast.id !== notificationId);
    set({ activeToasts: updatedToasts });
  },

  clearToasts: () => {
    set({ activeToasts: [] });
  },

  // Refresh connection status
  refreshConnectionStatus: () => {
    const connectionStatus = notificationService.getConnectionStatus();
    set({ connectionStatus });
  },
}));

// Subscribe to real-time notifications
notificationService.subscribe((notification) => {
  const store = useNotificationStore.getState();

  // Update store with new notification
  const notifications = notificationService.getNotifications();
  const unreadCount = notificationService.getUnreadNotifications().length;

  useNotificationStore.setState({ notifications, unreadCount });

  // Show toast if enabled
  if (store.showToasts) {
    store.showToast(notification);
  }
});
