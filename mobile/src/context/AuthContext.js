import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, tokenService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await tokenService.getToken();
      if (token) {
        // Verify token by fetching profile
        const response = await authAPI.getProfile();
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Token invalid or expired - try refresh
      try {
        const refreshToken = await tokenService.getRefreshToken();
        if (refreshToken) {
          const response = await authAPI.refreshToken(refreshToken);
          await tokenService.saveToken(response.data.access_token);
          const profileResponse = await authAPI.getProfile();
          setUser(profileResponse.data.user);
          setIsAuthenticated(true);
          return;
        }
      } catch (refreshError) {
        // Refresh also failed
      }
      await tokenService.removeTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup(name, email, password);
      const { access_token, refresh_token, token, user } = response.data;
      // Save both tokens (access_token is preferred, fallback to token)
      await tokenService.saveTokens(access_token || token, refresh_token);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed',
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, refresh_token, token, user } = response.data;
      // Save both tokens (access_token is preferred, fallback to token)
      await tokenService.saveTokens(access_token || token, refresh_token);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      await tokenService.removeTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signup,
        login,
        logout,
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
