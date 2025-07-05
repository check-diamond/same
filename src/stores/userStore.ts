import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type User, UserRole, type CreateUserRequest, type UpdateUserRequest, type UserPermissions } from '../types/User';
import { userService } from '../services/userService';

interface UserState {
  // Current user state
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // User management
  users: User[];
  selectedUser: User | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  // User management (admin)
  loadUsers: () => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<{ success: boolean; message?: string }>;
  updateUser: (userId: string, updateData: UpdateUserRequest) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;

  // Profile management
  updateProfile: (updateData: { name?: string; avatar?: string }) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;

  // Permissions
  hasPermission: (permission: keyof UserPermissions) => boolean;
  hasAnyPermission: (permissions: (keyof UserPermissions)[]) => boolean;

  // UI state
  setSelectedUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      users: [],
      selectedUser: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const result = await userService.login(email, password);

          if (result.success && result.user) {
            set({
              currentUser: result.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, message: result.message };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: 'Erro ao fazer login' };
        }
      },

      // Logout action
      logout: () => {
        userService.logout();
        set({
          currentUser: null,
          isAuthenticated: false,
          users: [],
          selectedUser: null,
        });
      },

      // Load all users (admin only)
      loadUsers: async () => {
        try {
          const users = await userService.getAllUsers();
          set({ users });
        } catch (error) {
          console.error('Error loading users:', error);
        }
      },

      // Create new user
      createUser: async (userData: CreateUserRequest) => {
        try {
          const result = await userService.createUser(userData);

          if (result.success && result.user) {
            const { users } = get();
            set({ users: [...users, result.user] });
            return { success: true };
          }

          return { success: false, message: result.message };
        } catch (error) {
          console.error('Error creating user:', error);
          return { success: false, message: 'Erro ao criar usuário' };
        }
      },

      // Update user
      updateUser: async (userId: string, updateData: UpdateUserRequest) => {
        try {
          const result = await userService.updateUser(userId, updateData);

          if (result.success && result.user) {
            const { users } = get();
            const updatedUsers = users.map(user =>
              user.id === userId ? result.user! : user
            );
            set({ users: updatedUsers });
            return { success: true };
          }

          return { success: false, message: result.message };
        } catch (error) {
          console.error('Error updating user:', error);
          return { success: false, message: 'Erro ao atualizar usuário' };
        }
      },

      // Delete user
      deleteUser: async (userId: string) => {
        try {
          const result = await userService.deleteUser(userId);

          if (result.success) {
            const { users } = get();
            const filteredUsers = users.filter(user => user.id !== userId);
            set({ users: filteredUsers });
            return { success: true };
          }

          return { success: false, message: result.message };
        } catch (error) {
          console.error('Error deleting user:', error);
          return { success: false, message: 'Erro ao excluir usuário' };
        }
      },

      // Update profile
      updateProfile: async (updateData: { name?: string; avatar?: string }) => {
        try {
          const result = await userService.updateProfile(updateData);

          if (result.success && result.user) {
            set({ currentUser: result.user });
            return { success: true };
          }

          return { success: false, message: result.message };
        } catch (error) {
          console.error('Error updating profile:', error);
          return { success: false, message: 'Erro ao atualizar perfil' };
        }
      },

      // Change password
      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          const result = await userService.changePassword(currentPassword, newPassword);
          return result;
        } catch (error) {
          console.error('Error changing password:', error);
          return { success: false, message: 'Erro ao alterar senha' };
        }
      },

      // Check permissions
      hasPermission: (permission: keyof UserPermissions) => {
        return userService.hasPermission(permission);
      },

      hasAnyPermission: (permissions: (keyof UserPermissions)[]) => {
        return userService.hasAnyPermission(permissions);
      },

      // UI state management
      setSelectedUser: (user: User | null) => {
        set({ selectedUser: user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
