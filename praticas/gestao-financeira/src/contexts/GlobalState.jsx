import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const GlobalStateContext = createContext(null);

const now = new Date();
const DEFAULT_FILTER = { month: now.getMonth() + 1, year: now.getFullYear() };

export function GlobalStateProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, byCategory: [] });
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCategories = useCallback(async () => {
    const list = await api.listCategories();
    setCategories(list);
  }, []);

  const refreshTransactions = useCallback(async (f = filter) => {
    const list = await api.listTransactions(f);
    setTransactions(list);
  }, [filter]);

  const refreshSummary = useCallback(async (f = filter) => {
    const s = await api.getSummary(f);
    setSummary(s);
  }, [filter]);

  const refreshAll = useCallback(async (f = filter) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refreshCategories(), refreshTransactions(f), refreshSummary(f)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshCategories, refreshTransactions, refreshSummary, filter]);

  useEffect(() => {
    if (isAuthenticated) refreshAll(filter);
    else {
      setCategories([]);
      setTransactions([]);
      setSummary({ income: 0, expense: 0, balance: 0, byCategory: [] });
    }
  }, [isAuthenticated, filter.month, filter.year]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = useCallback((patch) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  }, []);

  const addCategory = useCallback(async (payload) => {
    const created = await api.createCategory(payload);
    setCategories((prev) =>
      [...prev, created].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    );
    return created;
  }, []);

  const updateCategory = useCallback(async (id, payload) => {
    const updated = await api.updateCategory(id, payload);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const removeCategory = useCallback(async (id) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addTransaction = useCallback(async (payload) => {
    const created = await api.createTransaction(payload);
    setTransactions((prev) => [created, ...prev].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    ));
    await refreshSummary();
    return created;
  }, [refreshSummary]);

  const updateTransaction = useCallback(async (id, payload) => {
    const updated = await api.updateTransaction(id, payload);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    await refreshSummary();
    return updated;
  }, [refreshSummary]);

  const removeTransaction = useCallback(async (id) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await refreshSummary();
  }, [refreshSummary]);

  const value = useMemo(() => ({
    categories,
    transactions,
    summary,
    filter,
    loading,
    error,
    updateFilter,
    refreshAll,
    addCategory,
    updateCategory,
    removeCategory,
    addTransaction,
    updateTransaction,
    removeTransaction,
  }), [
    categories, transactions, summary, filter, loading, error,
    updateFilter, refreshAll, addCategory, updateCategory, removeCategory,
    addTransaction, updateTransaction, removeTransaction,
  ]);

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const ctx = useContext(GlobalStateContext);
  if (!ctx) throw new Error('useGlobalState deve estar dentro de <GlobalStateProvider>');
  return ctx;
}
