import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        if (storedUser && accessToken) {
          // Validate token by fetching profile
          const response = await api.getProfile();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response: AuthResponse = await api.login({ email, password });
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登入失敗，請稍後再試';
      setError(errorMessage);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const response: AuthResponse = await api.register({ email, password, name });
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '註冊失敗，請稍後再試';
      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await api.forgotPassword(email);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '發送重設密碼郵件失敗';
      setError(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      await api.resetPassword({ token, password });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '重設密碼失敗';
      setError(errorMessage);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      const response = await api.updateProfile(data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '更新個人資料失敗';
      setError(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};