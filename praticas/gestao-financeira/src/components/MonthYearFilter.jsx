import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function MonthYearFilter({ month, year, onChange }) {
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1];
  }, []);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MONTHS.map((label, i) => {
          const value = i + 1;
          const active = value === month;
          return (
            <Pressable
              key={label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ month: value, year })}
            >
              <Text style={active ? styles.textActive : styles.text}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {years.map((y) => {
          const active = y === year;
          return (
            <Pressable
              key={y}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ month, year: y })}
            >
              <Text style={active ? styles.textActive : styles.text}>{y}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  text: { color: '#475569', fontSize: 12 },
  textActive: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
