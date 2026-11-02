import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { authApi } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRoleDemo: (email: string, password: string) => Promise<void>;
  isAdmin: boolean;
  isHOD: boolean;
  isEmployee: boolean;
  isCA: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jbi_token');
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('jbi_user', JSON.stringify(profile));
        } catch (error) {
          console.error('Failed to load profile:', error);
          localStorage.removeItem('jbi_token');
          localStorage.removeItem('jbi_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('jbi_token', data.data.token);
    localStorage.setItem('jbi_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const switchRoleDemo = async (email: string, password: string) => {
    setLoading(true);
    try {
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isHOD = user?.role === 'HOD';
  const isEmployee = user?.role === 'Employee';
  const isCA = user?.role === 'CA';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchRoleDemo,
        isAdmin,
        isHOD,
        isEmployee,
        isCA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
