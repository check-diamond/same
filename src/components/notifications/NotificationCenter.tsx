import type React from 'react';
import { useState, useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { Notification, type NotificationCategory, type NotificationType } from '../../types/Notification';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Bell,
  BellOff,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  User,
  ShoppingCart,
  CreditCard,
  Database,
  Settings as SettingsIcon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NotificationCenterProps {
  className?: string;
  maxHeight?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  maxHeight = 'max-h-96'
}) => {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshConnectionStatus
  } = useNotificationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    refreshConnectionStatus();

    // Refresh data periodically
    const interval = setInterval(() => {
      refreshConnectionStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications, refreshConnectionStatus]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'read' && notification.read) ||
      (filterRead === 'unread' && !notification.read);

    return matchesSearch && matchesCategory && matchesType && matchesRead;
  });

  const getIcon = (type: NotificationType) => {
    const iconClass = "h-4 w-4";

    switch (type) {
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

  const getCategoryIcon = (category: NotificationCategory) => {
    const iconClass = "h-4 w-4 opacity-60";

    switch (category) {
      case 'order':
        return <ShoppingCart className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'system':
        return <SettingsIcon className={iconClass} />;
      case 'backup':
        return <Database className={iconClass} />;
      case 'user':
        return <User className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora há pouco';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return timestamp.toLocaleDateString('pt-BR');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300';
      case 'high':
        return 'bg-orange-100 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-lg">Notificações</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Connection status */}
            <div className="flex items-center space-x-1">
              {connectionStatus.connected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-gray-500">
                {connectionStatus.connected ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar todas como lidas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearAll} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar todas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex space-x-2">
            <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="order">Pedidos</SelectItem>
                <SelectItem value="payment">Pagamentos</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="backup">Backups</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRead} onValueChange={(value: any) => setFilterRead(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-0", maxHeight, "overflow-y-auto")}>
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                  !notification.read && "bg-blue-50 border-blue-100",
                  getPriorityColor(notification.priority)
                )}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        {getCategoryIcon(notification.category)}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}>
                                <Check className="mr-2 h-4 w-4" />
                                Marcar como lida
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Priority badge */}
                    {(notification.priority === 'high' || notification.priority === 'urgent') && (
                      <div className="mt-2">
                        <Badge
                          variant={notification.priority === 'urgent' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          Prioridade {notification.priority === 'urgent' ? 'Urgente' : 'Alta'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
