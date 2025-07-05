import type React from 'react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../stores/notificationStore';
import { type Notification, NotificationType } from '../../types/Notification';
import { Button } from '../ui/button';
import {
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  ShoppingCart,
  CreditCard,
  Database,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: (actionId: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (notification.autoClose && !notification.persistent) {
      setTimeLeft(notification.autoClose);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 100) {
            clearInterval(interval);
            handleClose();
            return null;
          }
          return prev - 100;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.autoClose, notification.persistent]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getIcon = () => {
    const iconClass = "h-5 w-5";

    switch (notification.type) {
      case 'success':
        return <CheckCircle className={cn(iconClass, "text-green-600")} />;
      case 'error':
        return <AlertCircle className={cn(iconClass, "text-red-600")} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-600")} />;
      case 'info':
      default:
        return <Info className={cn(iconClass, "text-blue-600")} />;
    }
  };

  const getCategoryIcon = () => {
    const iconClass = "h-4 w-4 opacity-60";

    switch (notification.category) {
      case 'order':
        return <ShoppingCart className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'system':
        return <Settings className={iconClass} />;
      case 'backup':
        return <Database className={iconClass} />;
      case 'user':
        return <User className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getTypeStyles = () => {
    const baseStyles = "border-l-4";

    switch (notification.type) {
      case 'success':
        return cn(baseStyles, "border-l-green-500 bg-green-50 dark:bg-green-900/20");
      case 'error':
        return cn(baseStyles, "border-l-red-500 bg-red-50 dark:bg-red-900/20");
      case 'warning':
        return cn(baseStyles, "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20");
      case 'info':
      default:
        return cn(baseStyles, "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20");
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return "ring-2 ring-red-400 ring-opacity-50";
      case 'high':
        return "ring-1 ring-orange-400 ring-opacity-50";
      default:
        return "";
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden",
        getTypeStyles(),
        getPriorityStyles()
      )}
    >
      {/* Progress bar for auto-close */}
      {timeLeft !== null && notification.autoClose && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: notification.autoClose / 1000, ease: "linear" }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {notification.title}
                </h4>
                {getCategoryIcon()}
              </div>

              <div className="flex items-center space-x-1">
                {/* Priority indicator */}
                {notification.priority === 'urgent' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                {notification.priority === 'high' && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}

                {/* Timestamp */}
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(notification.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {notification.message}
            </p>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {notification.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.style === 'primary' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      action.action();
                      onAction?.(action.id);
                      handleClose();
                    }}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Toast container component
export const NotificationToastContainer: React.FC = () => {
  const { activeToasts, hideToast } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {activeToasts.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onClose={() => hideToast(notification.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
