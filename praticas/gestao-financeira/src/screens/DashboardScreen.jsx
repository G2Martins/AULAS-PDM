import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { MonthYearFilter } from '../components/MonthYearFilter';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalState } from '../contexts/GlobalState';

const formatBRL = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
  decimalPlaces: 2,
};

export function DashboardScreen() {
  const { user } = useAuth();
  const { summary, transactions, loading, filter, updateFilter, refreshAll } = useGlobalState();

  const expenseChartData = useMemo(() => {
    const onlyExpenses = (summary.byCategory || []).filter((c) => !c.isIncome && c.total > 0);
    return onlyExpenses.map((c) => ({
      name: c.displayName,
      value: Number(c.total),
      color: c.background || '#64748b',
      legendFontColor: '#334155',
      legendFontSize: 12,
    }));
  }, [summary.byCategory]);

  const recent = transactions.slice(0, 8);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={recent}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refreshAll()} />}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeHi}>Olá, {user?.name?.split(' ')[0] || 'usuário'} 👋</Text>
            <Text style={styles.welcomeMsg}>Aqui está o resumo financeiro deste período.</Text>
          </View>

          <MonthYearFilter
            month={filter.month}
            year={filter.year}
            onChange={updateFilter}
          />

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

          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Despesas por categoria</Text>
            {loading && expenseChartData.length === 0 ? (
              <ActivityIndicator />
            ) : expenseChartData.length === 0 ? (
              <Text style={styles.empty}>Sem despesas no período.</Text>
            ) : (
              <PieChart
                data={expenseChartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="0"
                hasLegend
              />
            )}
          </View>

          <Text style={styles.sectionTitle}>Movimentações recentes</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma transação ainda.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
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
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  welcomeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  welcomeHi: { color: '#fff', fontSize: 18, fontWeight: '800' },
  welcomeMsg: { color: '#cbd5e1', marginTop: 2, fontSize: 12 },
  cards: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, padding: 12, borderRadius: 10 },
  income: { backgroundColor: '#dcfce7' },
  expense: { backgroundColor: '#fee2e2' },
  balance: { backgroundColor: '#e0e7ff' },
  cardLabel: { fontSize: 12, color: '#475569' },
  cardValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', alignSelf: 'flex-start' },
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
  empty: { textAlign: 'center', color: '#64748b', marginTop: 12 },
});
