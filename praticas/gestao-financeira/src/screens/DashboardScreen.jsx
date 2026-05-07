import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useGlobalState } from '../contexts/GlobalState';

const formatBRL = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function DashboardScreen() {
  const { summary, transactions, loading, refreshAll } = useGlobalState();

  const recent = transactions.slice(0, 10);

  return (
    <View style={styles.container}>
      <View style={styles.cards}>
        <View style={[styles.card, styles.income]}>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={styles.cardValue}>{formatBRL(summary.income)}</Text>
        </View>
        <View style={[styles.card, styles.expense]}>
          <Text style={styles.cardLabel}>Despesas</Text>
          <Text style={styles.cardValue}>{formatBRL(summary.expense)}</Text>
        </View>
        <View style={[styles.card, styles.balance]}>
          <Text style={styles.cardLabel}>Saldo</Text>
          <Text style={styles.cardValue}>{formatBRL(summary.balance)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Movimentações recentes</Text>

      {loading && transactions.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAll} />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma transação ainda.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.description}</Text>
                <Text style={styles.rowSubtitle}>
                  {item.category?.name} · {new Date(item.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text style={item.type === 'INCOME' ? styles.rowIncome : styles.rowExpense}>
                {item.type === 'INCOME' ? '+' : '-'} {formatBRL(item.amount)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  cards: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, padding: 12, borderRadius: 10 },
  income: { backgroundColor: '#dcfce7' },
  expense: { backgroundColor: '#fee2e2' },
  balance: { backgroundColor: '#e0e7ff' },
  cardLabel: { fontSize: 12, color: '#475569' },
  cardValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  row: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  rowIncome: { color: '#16a34a', fontWeight: '700' },
  rowExpense: { color: '#dc2626', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
