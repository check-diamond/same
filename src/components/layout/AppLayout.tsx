import type React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Diamond,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck,
  Database
} from 'lucide-react';
import { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/use-responsive';
import { MobileNavigation } from './ResponsiveLayout';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
}

function SidebarItem({ icon: Icon, label, path, isActive }: SidebarItemProps) {
  return (
    <Link to={path}>
      <motion.div
        whileHover={{ x: 2 }}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, hasPermission, currentUser } = useUserStore();
  const { isMobile, isTablet, deviceType } = useResponsive();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavigation = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permission: null },
    { icon: Users, label: 'Revendedores', path: '/revendedores', permission: 'canManageResellers' as const },
    { icon: ShoppingCart, label: 'Vendas', path: '/vendas', permission: 'canViewSales' as const },
    { icon: Package, label: 'Estoque', path: '/estoque', permission: 'canViewInventory' as const },
    { icon: Truck, label: 'Envios', path: '/envios', permission: null },
    { icon: CreditCard, label: 'Pagamentos', path: '/pagamentos', permission: 'canViewPayments' as const },
    { icon: Settings, label: 'Configurações PIX', path: '/configuracoes', permission: 'canConfigurePix' as const },
    { icon: Bot, label: 'IA Ana', path: '/ia', permission: null },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios', permission: 'canViewReports' as const },
    { icon: Database, label: 'Backups', path: '/backups', permission: 'canManageBackups' as const },
    { icon: UserCheck, label: 'Usuários', path: '/usuarios', permission: 'canManageUsers' as const },
  ];

  // Filter navigation based on user permissions
  const navigation = allNavigation.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  // Preparar itens para navegação mobile
  const mobileNavItems = navigation.slice(0, 5).map(item => ({
    ...item,
    isActive: location.pathname === item.path,
    onClick: () => navigate(item.path),
  }));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, use bottom navigation instead */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMobile
            ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
            : 'relative translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 p-6 border-b">
          <Diamond className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Kwai Diamonds</h1>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="p-4 border-t space-y-3">
          {currentUser && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-500">
                  {currentUser.role === 'admin' ? 'Administrador' :
                   currentUser.role === 'manager' ? 'Gerente' :
                   currentUser.role === 'sales' ? 'Vendedor' : 'Visualizador'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - sempre visível em mobile, escondido em desktop quando há sidebar */}
        <header className={`bg-white shadow-sm border-b ${isMobile ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Diamond className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-slate-800">
                {isMobile ? 'Check' : 'Agência Check'}
              </span>
            </div>
            <div className="w-8" /> {/* Spacer for balance */}
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-auto ${
          isMobile ? 'p-4 pb-20' : isTablet ? 'p-6' : 'p-8'
        }`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation - apenas em mobile */}
      <MobileNavigation
        items={mobileNavItems}
        className={isMobile ? 'block' : 'hidden'}
      />
    </div>
  );
}
