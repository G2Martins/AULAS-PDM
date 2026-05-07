import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const GlobalStateContext = createContext(null);

export function GlobalStateProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCategories = useCallback(async () => {
    const list = await api.listCategories();
    setCategories(list);
  }, []);

  const refreshTransactions = useCallback(async () => {
    const list = await api.listTransactions();
    setTransactions(list);
  }, []);

  const refreshSummary = useCallback(async () => {
    const s = await api.getSummary();
    setSummary(s);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refreshCategories(), refreshTransactions(), refreshSummary()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshCategories, refreshTransactions, refreshSummary]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addCategory = useCallback(async (payload) => {
    const created = await api.createCategory(payload);
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const removeCategory = useCallback(async (id) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addTransaction = useCallback(async (payload) => {
    const created = await api.createTransaction(payload);
    setTransactions((prev) => [created, ...prev]);
    await refreshSummary();
    return created;
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
    loading,
    error,
    refreshAll,
    addCategory,
    removeCategory,
    addTransaction,
    removeTransaction,
  }), [
    categories, transactions, summary, loading, error,
    refreshAll, addCategory, removeCategory, addTransaction, removeTransaction,
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
