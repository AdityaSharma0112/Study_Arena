import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    const savedToken = getAuthToken();
    if (!savedToken) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiService.getCurrentUser();
      if (userData && userData.user) {
        setUser(userData.user);
        setTokenState(savedToken);
      } else {
        setUser(null);
        setTokenState(null);
        setAuthToken(null);
      }
    } catch (err) {
      console.error('Failed to verify user auth:', err);
      setUser(null);
      setTokenState(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username, password) => {
    const res = await apiService.login(username, password);
    if (res.token) {
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsLoginModalOpen(false);
      return res.user;
    }
    throw new Error('Authentication response missing token');
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    }
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        refreshAuth: checkAuth,
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
