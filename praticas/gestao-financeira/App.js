import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from './src/components/TabBar';
import { GlobalStateProvider, useGlobalState } from './src/contexts/GlobalState';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';

const TABS = [
  { key: 'dashboard',    label: 'Início' },
  { key: 'transactions', label: 'Transações' },
  { key: 'categories',   label: 'Categorias' },
];

function AppShell() {
  const [tab, setTab] = useState('dashboard');
  const { error } = useGlobalState();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestão Financeira</Text>
      </View>

      {error ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>API: {error}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        {tab === 'dashboard' && <DashboardScreen />}
        {tab === 'transactions' && <TransactionsScreen />}
        {tab === 'categories' && <CategoriesScreen />}
      </View>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GlobalStateProvider>
        <AppShell />
      </GlobalStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  errorBar: { backgroundColor: '#fee2e2', padding: 8 },
  errorText: { color: '#991b1b', fontSize: 12 },
});
