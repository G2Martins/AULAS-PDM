import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const formatDateInput = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const parseDateInput = (text) => {
  const match = String(text).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isFinite(d.getTime()) ? d : null;
};

export function TransactionModal({ visible, mode, initial, categories, onClose, onSubmit }) {
  const isEdit = mode === 'edit';

  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dateText, setDateText] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [categoryId, setCategoryId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setDescription(initial.description ?? '');
      setValue(initial.value != null ? String(initial.value).replace('.', ',') : '');
      setDateText(formatDateInput(initial.date) || formatDateInput(new Date()));
      setIsIncome(!!initial.category?.isIncome);
      setCategoryId(initial.categoryId ?? initial.category?.id ?? null);
    } else {
      setDescription('');
      setValue('');
      setDateText(formatDateInput(new Date()));
      setIsIncome(false);
      setCategoryId(null);
    }
  }, [visible, initial]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.isIncome === isIncome),
    [categories, isIncome],
  );

  async function handleSubmit() {
    if (!description.trim() || !value || !categoryId) {
      Alert.alert('Validação', 'Preencha descrição, valor e categoria.');
      return;
    }
    const numericValue = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      Alert.alert('Validação', 'Informe um valor válido maior que zero.');
      return;
    }
    const parsedDate = parseDateInput(dateText);
    if (dateText && !parsedDate) {
      Alert.alert('Validação', 'Data inválida. Use DD/MM/AAAA.');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        description: description.trim(),
        value: numericValue,
        categoryId,
        date: parsedDate ? parsedDate.toISOString() : undefined,
      });
      onClose();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ gap: 10 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{isEdit ? 'Editar transação' : 'Nova transação'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Descrição"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Valor (ex: 199,90)"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
            />
            <TextInput
              style={styles.input}
              placeholder="Data DD/MM/AAAA"
              value={dateText}
              onChangeText={setDateText}
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggle, isIncome && styles.toggleActiveIncome]}
                onPress={() => { setIsIncome(true); setCategoryId(null); }}
              >
                <Text style={isIncome ? styles.toggleTextActive : styles.toggleText}>Receita</Text>
              </Pressable>
              <Pressable
                style={[styles.toggle, !isIncome && styles.toggleActiveExpense]}
                onPress={() => { setIsIncome(false); setCategoryId(null); }}
              >
                <Text style={!isIncome ? styles.toggleTextActive : styles.toggleText}>Despesa</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.chipsRow}>
              {visibleCategories.length === 0 ? (
                <Text style={styles.hint}>
                  Cadastre uma categoria de {isIncome ? 'receita' : 'despesa'} antes.
                </Text>
              ) : (
                visibleCategories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.chip,
                      categoryId === c.id && { backgroundColor: c.background || '#0ea5e9', borderColor: c.background || '#0ea5e9' },
                    ]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <Text style={categoryId === c.id ? styles.chipTextActive : styles.chipText}>
                      {c.displayName}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={submitting}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.btnPrimaryText}>{submitting ? 'Salvando…' : 'Salvar'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  label: { color: '#475569', fontSize: 12, marginTop: 4 },
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  chipText: { color: '#475569', fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '700', fontSize: 12 },
  hint: { color: '#64748b', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnGhost: { backgroundColor: '#e2e8f0' },
  btnGhostText: { color: '#0f172a', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#0ea5e9' },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
});
