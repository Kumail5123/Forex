import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../api/client';
import { colors, spacing, type, radius } from '../theme/theme';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { history: fresh } = await api.getTradeHistory();
      setHistory(fresh);
    } catch (err) {
      // silent
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={type.title}>Trade history</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={type.body}>
                {item.pair} · {item.side.toUpperCase()} · {item.units} units
              </Text>
              <Text style={type.caption}>
                {new Date(item.closedAt).toLocaleDateString()} · Entry {item.entryPrice} → Exit {item.exitPrice}
              </Text>
            </View>
            <Text style={[type.mono, { color: item.pnl >= 0 ? colors.gain : colors.loss }]}>
              {item.pnl >= 0 ? '+' : ''}${item.pnl}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.xl }]}>
            No closed trades yet. Your trade history will appear here.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
