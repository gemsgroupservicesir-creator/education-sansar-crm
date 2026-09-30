import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  canDeleteLeads: boolean;
  canAssignCounselor: boolean;
  canManageCampaigns: boolean;
  canEditSettings: boolean;
  isReadOnly: boolean;
}

const defaultUser: User = {
  id: 'u-super',
  name: 'Bikash Karki',
  email: 'admin@educationsansar.com',
  role: 'Super Admin',
  phone: '+91 9811002233',
  is_active: 1
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sansar_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(user?.role || 'Super Admin');

  useEffect(() => {
    if (user) {
      localStorage.setItem('sansar_user', JSON.stringify(user));
      setCurrentRole(user.role);
    } else {
      localStorage.removeItem('sansar_user');
    }
  }, [user]);

  const switchRole = async (newRole: UserRole) => {
    try {
      const res = await api.login({ role: newRole });
      if (res.user) {
        setUser(res.user);
        setCurrentRole(newRole);
      }
    } catch (e) {
      // Fallback local update
      if (user) {
        const updated = { ...user, role: newRole };
        setUser(updated);
        setCurrentRole(newRole);
      }
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res.user) {
      setUser(res.user);
      setCurrentRole(res.user.role);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const canManageUsers = currentRole === 'Super Admin';
  const canManageIntegrations = currentRole === 'Super Admin';
  const canDeleteLeads = currentRole === 'Super Admin' || currentRole === 'Admin';
  const canAssignCounselor = currentRole === 'Super Admin' || currentRole === 'Admin';
  const canManageCampaigns = currentRole === 'Super Admin' || currentRole === 'Admin' || currentRole === 'Marketing Manager';
  const canEditSettings = currentRole === 'Super Admin';
  const isReadOnly = currentRole === 'Management';

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        switchRole,
        login,
        logout,
        canManageUsers,
        canManageIntegrations,
        canDeleteLeads,
        canAssignCounselor,
        canManageCampaigns,
        canEditSettings,
        isReadOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
