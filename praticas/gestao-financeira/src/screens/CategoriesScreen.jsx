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

const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const PALETTE = ['#ef4444', '#f97316', '#eab308', '#16a34a', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b'];

export function CategoriesScreen() {
  const { categories, addCategory, removeCategory } = useGlobalState();
  const [displayName, setDisplayName] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [background, setBackground] = useState(PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!displayName.trim()) {
      Alert.alert('Validação', 'Informe o nome da categoria.');
      return;
    }
    const name = slugify(displayName);
    if (!name) {
      Alert.alert('Validação', 'Nome inválido.');
      return;
    }
    try {
      setSubmitting(true);
      await addCategory({
        name,
        displayName: displayName.trim(),
        isIncome,
        background,
        icon: 'label',
      });
      setDisplayName('');
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(item) {
    if (item.isDefault) {
      Alert.alert('Categoria padrão', 'Categorias padrão não podem ser excluídas.');
      return;
    }
    Alert.alert('Excluir', `Remover "${item.displayName}"?`, [
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
          placeholder="Nome da nova categoria"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, isIncome && styles.toggleActiveIncome]}
            onPress={() => setIsIncome(true)}
          >
            <Text style={isIncome ? styles.toggleTextActive : styles.toggleText}>Receita</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, !isIncome && styles.toggleActiveExpense]}
            onPress={() => setIsIncome(false)}
          >
            <Text style={!isIncome ? styles.toggleTextActive : styles.toggleText}>Despesa</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Cor</Text>
        <View style={styles.paletteRow}>
          {PALETTE.map((c) => (
            <Pressable
              key={c}
              onPress={() => setBackground(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                background === c && styles.swatchActive,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.button, submitting && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Salvando…' : 'Adicionar'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.background || '#94a3b8' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.displayName}
                {item.isDefault ? <Text style={styles.badge}> · padrão</Text> : null}
              </Text>
              <Text style={styles.rowSubtitle}>
                {item.isIncome ? 'Receita' : 'Despesa'}
              </Text>
            </View>
            {!item.isDefault ? (
              <Pressable onPress={() => handleDelete(item)}>
                <Text style={styles.delete}>Excluir</Text>
              </Pressable>
            ) : (
              <Text style={styles.locked}>🔒</Text>
            )}
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
  label: { color: '#475569', fontSize: 12 },
  paletteRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  swatchActive: { borderWidth: 3, borderColor: '#0f172a' },
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
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#64748b', fontSize: 12 },
  badge: { color: '#94a3b8', fontSize: 11, fontWeight: '400' },
  delete: { color: '#dc2626', fontWeight: '600' },
  locked: { color: '#94a3b8', fontSize: 16 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
