import React, { useMemo, useState } from 'react';
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

const formatBRL = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function TransactionsScreen() {
  const { transactions, categories, addTransaction, removeTransaction } = useGlobalState();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [categoryId, setCategoryId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  async function handleAdd() {
    if (!description.trim() || !amount || !categoryId) {
      Alert.alert('Validação', 'Preencha descrição, valor e categoria.');
      return;
    }
    const numericAmount = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Validação', 'Informe um valor válido maior que zero.');
      return;
    }
    try {
      setSubmitting(true);
      await addTransaction({
        description: description.trim(),
        amount: numericAmount,
        type,
        categoryId,
      });
      setDescription('');
      setAmount('');
      setCategoryId(null);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(item) {
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
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (ex: 199,90)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, type === 'INCOME' && styles.toggleActiveIncome]}
            onPress={() => {
              setType('INCOME');
              setCategoryId(null);
            }}
          >
            <Text style={type === 'INCOME' ? styles.toggleTextActive : styles.toggleText}>
              Receita
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, type === 'EXPENSE' && styles.toggleActiveExpense]}
            onPress={() => {
              setType('EXPENSE');
              setCategoryId(null);
            }}
          >
            <Text style={type === 'EXPENSE' ? styles.toggleTextActive : styles.toggleText}>
              Despesa
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chipsRow}>
          {visibleCategories.length === 0 ? (
            <Text style={styles.empty}>Cadastre uma categoria de {type === 'INCOME' ? 'receita' : 'despesa'} primeiro.</Text>
          ) : (
            visibleCategories.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chip, categoryId === c.id && styles.chipActive]}
                onPress={() => setCategoryId(c.id)}
              >
                <Text style={categoryId === c.id ? styles.chipTextActive : styles.chipText}>
                  {c.name}
                </Text>
              </Pressable>
            ))
          )}
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
        data={transactions}
        keyExtractor={(item) => String(item.id)}
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
            <Pressable onPress={() => handleDelete(item)} style={{ marginLeft: 10 }}>
              <Text style={styles.delete}>X</Text>
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
  label: { fontSize: 12, color: '#475569', marginTop: 4 },
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { color: '#475569', fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '700', fontSize: 12 },
  button: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
  rowIncome: { color: '#16a34a', fontWeight: '700' },
  rowExpense: { color: '#dc2626', fontWeight: '700' },
  delete: { color: '#dc2626', fontWeight: '700', paddingHorizontal: 6 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 12 },
});
