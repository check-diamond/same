import { type User, UserRole, type CreateUserRequest, type UpdateUserRequest, ROLE_PERMISSIONS, type UserPermissions } from '../types/User';

class UserService {
  private users: User[] = [
    {
      id: '1',
      email: 'juliocorrea@check2.com.br',
      name: 'Julio Correa - Administrador',
      role: 'admin',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      permissions: Object.keys(ROLE_PERMISSIONS.admin).filter(key =>
        ROLE_PERMISSIONS.admin[key as keyof UserPermissions]
      ),
    },
    {
      id: '2',
      email: 'manager@agenciacheck.com',
      name: 'Gerente Comercial',
      role: 'manager',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      permissions: Object.keys(ROLE_PERMISSIONS.manager).filter(key =>
        ROLE_PERMISSIONS.manager[key as keyof UserPermissions]
      ),
    },
  ];

  private currentUser: User | null = null;

  // Authenticate user
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // In a real app, this would validate against a backend
      const user = this.users.find(u => u.email === email && u.isActive);

      if (!user) {
        return { success: false, message: 'Usuário não encontrado ou inativo' };
      }

      // Validate specific credentials
      if (user.email === 'juliocorrea@check2.com.br' && password !== 'Ju113007') {
        return { success: false, message: 'Senha inválida' };
      } else if (user.email !== 'juliocorrea@check2.com.br' && password.length < 3) {
        return { success: false, message: 'Senha inválida' };
      }

      // Update last login
      user.lastLogin = new Date();
      this.currentUser = user;

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erro interno do servidor' };
    }
  }

  // Get current authenticated user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Logout user
  logout(): void {
    this.currentUser = null;
  }

  // Check if user has specific permission
  hasPermission(permission: keyof UserPermissions): boolean {
    if (!this.currentUser) return false;

    const rolePermissions = ROLE_PERMISSIONS[this.currentUser.role];
    return rolePermissions[permission] || false;
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: (keyof UserPermissions)[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    if (!this.hasPermission('canManageUsers')) {
      throw new Error('Acesso negado: permissão insuficiente');
    }
    return this.users;
  }

  // Create new user (admin only)
  async createUser(userData: CreateUserRequest): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      if (!this.hasPermission('canManageUsers')) {
        return { success: false, message: 'Acesso negado: permissão insuficiente' };
      }

      // Check if email already exists
      if (this.users.some(u => u.email === userData.email)) {
        return { success: false, message: 'Email já está em uso' };
      }

      const newUser: User = {
        id: (this.users.length + 1).toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: Object.keys(ROLE_PERMISSIONS[userData.role]).filter(key =>
          ROLE_PERMISSIONS[userData.role][key as keyof UserPermissions]
        ),
      };

      this.users.push(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, message: 'Erro ao criar usuário' };
    }
  }

  // Update user (admin only)
  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      if (!this.hasPermission('canManageUsers')) {
        return { success: false, message: 'Acesso negado: permissão insuficiente' };
      }

      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      const user = this.users[userIndex];

      // Update user data
      if (updateData.name) user.name = updateData.name;
      if (updateData.role) {
        user.role = updateData.role;
        // Update permissions based on new role
        const rolePermissions = ROLE_PERMISSIONS[updateData.role];
        user.permissions = Object.keys(rolePermissions).filter(key =>
          rolePermissions[key as keyof UserPermissions]
        );
      }
      if (updateData.isActive !== undefined) user.isActive = updateData.isActive;
      if (updateData.permissions) user.permissions = updateData.permissions;

      user.updatedAt = new Date();

      return { success: true, user };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'Erro ao atualizar usuário' };
    }
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.hasPermission('canManageUsers')) {
        return { success: false, message: 'Acesso negado: permissão insuficiente' };
      }

      // Prevent deleting current user
      if (this.currentUser?.id === userId) {
        return { success: false, message: 'Não é possível excluir o próprio usuário' };
      }

      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      this.users.splice(userIndex, 1);
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: 'Erro ao excluir usuário' };
    }
  }

  // Get user activity log
  async getUserActivity(userId?: string): Promise<any[]> {
    if (!this.hasPermission('canViewLogs')) {
      throw new Error('Acesso negado: permissão insuficiente');
    }

    // Mock activity data
    return [
      {
        id: '1',
        userId: userId || this.currentUser?.id,
        action: 'login',
        timestamp: new Date(),
        details: 'Login realizado com sucesso',
      },
      {
        id: '2',
        userId: userId || this.currentUser?.id,
        action: 'create_sale',
        timestamp: new Date(Date.now() - 3600000),
        details: 'Nova venda criada - R$ 150,00',
      },
    ];
  }

  // Update user profile (own profile)
  async updateProfile(updateData: { name?: string; avatar?: string }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      const userIndex = this.users.findIndex(u => u.id === this.currentUser!.id);
      if (userIndex === -1) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      const user = this.users[userIndex];

      if (updateData.name) user.name = updateData.name;
      if (updateData.avatar) user.avatar = updateData.avatar;

      user.updatedAt = new Date();
      this.currentUser = user;

      return { success: true, user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Erro ao atualizar perfil' };
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, message: 'Usuário não autenticado' };
      }

      // In a real app, validate current password
      if (currentPassword.length < 3) {
        return { success: false, message: 'Senha atual inválida' };
      }

      if (newPassword.length < 6) {
        return { success: false, message: 'Nova senha deve ter pelo menos 6 caracteres' };
      }

      // In a real app, hash and store the new password
      return { success: true, message: 'Senha alterada com sucesso' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Erro ao alterar senha' };
    }
  }
}

export const userService = new UserService();
