import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useGlobalState } from '../contexts/GlobalState';

export function CategoriesScreen() {
  const { categories, addCategory, removeCategory } = useGlobalState();
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert('Validação', 'Informe o nome da categoria.');
      return;
    }
    try {
      setSubmitting(true);
      await addCategory({ name: name.trim(), type });
      setName('');
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(item) {
    Alert.alert('Excluir', `Remover "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCategory(item.id);
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome da categoria"
          value={name}
          onChangeText={setName}
        />
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, type === 'INCOME' && styles.toggleActiveIncome]}
            onPress={() => setType('INCOME')}
          >
            <Text style={type === 'INCOME' ? styles.toggleTextActive : styles.toggleText}>
              Receita
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, type === 'EXPENSE' && styles.toggleActiveExpense]}
            onPress={() => setType('EXPENSE')}
          >
            <Text style={type === 'EXPENSE' ? styles.toggleTextActive : styles.toggleText}>
              Despesa
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.button, submitting && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Salvando...' : 'Adicionar'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria cadastrada.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View
              style={[
                styles.dot,
                { backgroundColor: item.type === 'INCOME' ? '#16a34a' : '#dc2626' },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {item.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </Text>
            </View>
            <Pressable onPress={() => handleDelete(item)}>
              <Text style={styles.delete}>Excluir</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  form: { gap: 8, padding: 12, backgroundColor: '#fff', borderRadius: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  toggleActiveIncome: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  toggleActiveExpense: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  toggleText: { color: '#475569' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  button: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#64748b', fontSize: 12 },
  delete: { color: '#dc2626', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
