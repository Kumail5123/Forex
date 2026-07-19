import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const { user: freshUser } = await api.me();
          setUser(freshUser);
        } catch {
          await AsyncStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signup = useCallback(async ({ fullName, email, password }) => {
    const { user: newUser, token } = await api.signup({ fullName, email, password });
    await AsyncStorage.setItem('authToken', token);
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { user: loggedInUser, token } = await api.login({ email, password });
    await AsyncStorage.setItem('authToken', token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('authToken');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: freshUser } = await api.me();
    setUser(freshUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
