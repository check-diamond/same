import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import type { UserRole, UserPermissions } from '@/types/User';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole;
  requirePermission?: keyof UserPermissions;
  requireAnyPermission?: (keyof UserPermissions)[];
}

export function ProtectedRoute({
  children,
  requireRole,
  requirePermission,
  requireAnyPermission
}: ProtectedRouteProps) {
  const { isAuthenticated, currentUser, hasPermission, hasAnyPermission } = useUserStore();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user account is active
  if (!currentUser.isActive) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if user has that role
  if (requireRole && currentUser.role !== requireRole) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  // If a specific permission is required, check if user has that permission
  if (requirePermission && !hasPermission(requirePermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If any of the permissions is required, check if user has at least one
  if (requireAnyPermission && !hasAnyPermission(requireAnyPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
