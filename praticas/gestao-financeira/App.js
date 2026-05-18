import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from './src/components/TabBar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { GlobalStateProvider, useGlobalState } from './src/contexts/GlobalState';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';

const TABS = [
  { key: 'dashboard',    label: 'Início' },
  { key: 'transactions', label: 'Transações' },
  { key: 'categories',   label: 'Categorias' },
];

function AppShell() {
  const [tab, setTab] = useState('dashboard');
  const { error } = useGlobalState();
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Sair', `Encerrar sessão de ${user?.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Gestão Financeira</Text>
          <Text style={styles.subtitle}>Bem-vindo(a), {user?.name}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
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
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

function AuthGate() {
  const { isAuthenticated, bootstrapping } = useAuth();
  const [screen, setScreen] = useState('login');

  if (bootstrapping) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.bootText}>Carregando…</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return screen === 'login' ? (
      <LoginScreen onSwitchToRegister={() => setScreen('register')} />
    ) : (
      <RegisterScreen onSwitchToLogin={() => setScreen('login')} />
    );
  }

  return (
    <GlobalStateProvider>
      <AppShell />
    </GlobalStateProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#e0f2fe', fontSize: 12 },
  logout: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  content: { flex: 1 },
  errorBar: { backgroundColor: '#fee2e2', padding: 8 },
  errorText: { color: '#991b1b', fontSize: 12 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', gap: 8 },
  bootText: { color: '#fff' },
});
