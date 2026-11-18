import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setCachedCsrfToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          setAccount(data.account);
          if (data.csrfToken) {
            setCachedCsrfToken(data.csrfToken);
          }
        }
      } catch (err) {
        // Not logged in or session expired
        setUser(null);
        setAccount(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.success) {
        setUser(data.user);
        setAccount(data.account);
        if (data.csrfToken) {
          setCachedCsrfToken(data.csrfToken);
        }
        return data;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await api.post('/auth/register', userData);
      if (data.success) {
        setUser(data.user);
        setAccount(data.account);
        if (data.csrfToken) {
          setCachedCsrfToken(data.csrfToken);
        }
        return data;
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      console.warn('Logout request warning:', err.message);
    } finally {
      setUser(null);
      setAccount(null);
      setCachedCsrfToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        setAccount(data.account);
      }
    } catch (err) {
      console.warn('Failed to refresh user data:', err.message);
    }
  };

  const updateUserState = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const updateAccountState = (updatedAccount) => {
    setAccount((prev) => ({ ...prev, ...updatedAccount }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
        updateUserState,
        updateAccountState,
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

export default AuthContext;
