export type UserRole = 'admin' | 'manager' | 'sales' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}

export interface UserPermissions {
  // Vendas permissions
  canViewSales: boolean;
  canCreateSales: boolean;
  canEditSales: boolean;
  canDeleteSales: boolean;

  // Estoque permissions
  canViewInventory: boolean;
  canEditInventory: boolean;
  canManageStock: boolean;

  // PIX and payments
  canViewPayments: boolean;
  canManagePayments: boolean;
  canConfigurePix: boolean;

  // Users and admin
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageBackups: boolean;
  canAccessAnalytics: boolean;

  // Revendedores
  canManageResellers: boolean;

  // System
  canManageSettings: boolean;
  canViewLogs: boolean;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  permissions?: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canViewSales: true,
    canCreateSales: true,
    canEditSales: true,
    canDeleteSales: true,
    canViewInventory: true,
    canEditInventory: true,
    canManageStock: true,
    canViewPayments: true,
    canManagePayments: true,
    canConfigurePix: true,
    canManageUsers: true,
    canViewReports: true,
    canManageBackups: true,
    canAccessAnalytics: true,
    canManageResellers: true,
    canManageSettings: true,
    canViewLogs: true,
  },
  manager: {
    canViewSales: true,
    canCreateSales: true,
    canEditSales: true,
    canDeleteSales: true,
    canViewInventory: true,
    canEditInventory: true,
    canManageStock: true,
    canViewPayments: true,
    canManagePayments: false,
    canConfigurePix: false,
    canManageUsers: false,
    canViewReports: true,
    canManageBackups: false,
    canAccessAnalytics: true,
    canManageResellers: true,
    canManageSettings: false,
    canViewLogs: false,
  },
  sales: {
    canViewSales: true,
    canCreateSales: true,
    canEditSales: true,
    canDeleteSales: false,
    canViewInventory: true,
    canEditInventory: false,
    canManageStock: false,
    canViewPayments: true,
    canManagePayments: false,
    canConfigurePix: false,
    canManageUsers: false,
    canViewReports: false,
    canManageBackups: false,
    canAccessAnalytics: false,
    canManageResellers: false,
    canManageSettings: false,
    canViewLogs: false,
  },
  viewer: {
    canViewSales: true,
    canCreateSales: false,
    canEditSales: false,
    canDeleteSales: false,
    canViewInventory: true,
    canEditInventory: false,
    canManageStock: false,
    canViewPayments: true,
    canManagePayments: false,
    canConfigurePix: false,
    canManageUsers: false,
    canViewReports: true,
    canManageBackups: false,
    canAccessAnalytics: true,
    canManageResellers: false,
    canManageSettings: false,
    canViewLogs: false,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  sales: 'Vendedor',
  viewer: 'Visualizador',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso completo a todas as funcionalidades do sistema',
  manager: 'Gerenciamento de vendas, estoque e relatórios',
  sales: 'Criação e edição de vendas, visualização de estoque',
  viewer: 'Apenas visualização de dados e relatórios',
};
