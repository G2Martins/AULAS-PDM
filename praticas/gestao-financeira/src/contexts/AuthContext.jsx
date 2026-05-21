import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setOnUnauthorized } from '../services/api';

const STORAGE_TOKEN = '@gestao-financeira:token';
const STORAGE_USER = '@gestao-financeira:user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_TOKEN),
          AsyncStorage.getItem(STORAGE_USER),
        ]);
        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Falha ao restaurar sessão:', e);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const persist = useCallback(async (nextUser, nextToken) => {
    setAuthToken(nextToken);
    setUser(nextUser);
    setToken(nextToken);
    await AsyncStorage.multiSet([
      [STORAGE_TOKEN, nextToken],
      [STORAGE_USER, JSON.stringify(nextUser)],
    ]);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { user: u, token: t } = await api.login({ email, password });
    await persist(u, t);
    return u;
  }, [persist]);

  const register = useCallback(async ({ name, email, password }) => {
    const { user: u, token: t } = await api.register({ name, email, password });
    await persist(u, t);
    return u;
  }, [persist]);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove([STORAGE_TOKEN, STORAGE_USER]);
  }, []);

  // Registra handler para 401 → encerra sessão automaticamente
  useEffect(() => {
    setOnUnauthorized(() => logout());
    return () => setOnUnauthorized(null);
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, bootstrapping, isAuthenticated: !!token, login, register, logout }),
    [user, token, bootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve estar dentro de <AuthProvider>');
  return ctx;
}
