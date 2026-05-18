import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MonthYearFilter } from '../components/MonthYearFilter';
import { TransactionModal } from '../components/TransactionModal';
import { useGlobalState } from '../contexts/GlobalState';

const formatBRL = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function TransactionsScreen() {
  const {
    transactions,
    categories,
    filter,
    updateFilter,
    addTransaction,
    updateTransaction,
    removeTransaction,
  } = useGlobalState();

  const [modal, setModal] = useState({ visible: false, mode: 'create', initial: null });

  function openCreate() {
    setModal({ visible: true, mode: 'create', initial: null });
  }

  function openEdit(item) {
    setModal({ visible: true, mode: 'edit', initial: item });
  }

  function closeModal() {
    setModal((m) => ({ ...m, visible: false }));
  }

  async function handleSubmit(payload) {
    if (modal.mode === 'edit' && modal.initial) {
      await updateTransaction(modal.initial.id, payload);
    } else {
      await addTransaction(payload);
    }
  }

  function handleLongPress(item) {
    Alert.alert(
      item.description,
      'Escolha uma ação',
      [
        { text: 'Editar', onPress: () => openEdit(item) },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Excluir', `Remover "${item.description}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await removeTransaction(item.id);
                  } catch (e) {
                    Alert.alert('Erro', e.message);
                  }
                },
              },
            ]),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <MonthYearFilter month={filter.month} year={filter.year} onChange={updateFilter} />

      <Pressable style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ Nova transação</Text>
      </Pressable>

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma transação neste período.</Text>
        }
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleLongPress(item)} delayLongPress={300}>
            <View style={styles.row}>
              <View
                style={[
                  styles.bullet,
                  { backgroundColor: item.category?.background || '#94a3b8' },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.description}</Text>
                <Text style={styles.rowSubtitle}>
                  {item.category?.displayName} · {new Date(item.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text style={item.category?.isIncome ? styles.rowIncome : styles.rowExpense}>
                {item.category?.isIncome ? '+' : '-'} {formatBRL(item.value)}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Text style={styles.tip}>💡 Pressione e segure uma transação para editar ou excluir.</Text>

      <TransactionModal
        visible={modal.visible}
        mode={modal.mode}
        initial={modal.initial}
        categories={categories}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#f8fafc' },
  fab: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  fabText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  bullet: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  rowIncome: { color: '#16a34a', fontWeight: '700' },
  rowExpense: { color: '#dc2626', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
  tip: { textAlign: 'center', color: '#94a3b8', fontSize: 11 },
});
