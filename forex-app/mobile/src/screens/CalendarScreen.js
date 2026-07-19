import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../api/client';
import { colors, spacing, type, radius } from '../theme/theme';

const IMPACT_COLOR = { high: colors.loss, medium: colors.warning, low: colors.textSecondary };

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { events: fresh } = await api.getCalendarEvents();
      setEvents(fresh.sort((a, b) => new Date(a.time) - new Date(b.time)));
    } catch (err) {
      // silent — keep whatever we last had
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
        <Text style={type.title}>Economic calendar</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.impactDot, { backgroundColor: IMPACT_COLOR[item.impact] }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={type.caption}>{item.currency}</Text>
                <Text style={type.caption}>
                  {new Date(item.time).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={type.body}>{item.title}</Text>
              <View style={styles.rowBottom}>
                <Text style={type.caption}>Forecast: {item.forecast ?? '—'}</Text>
                <Text style={type.caption}>Previous: {item.previous ?? '—'}</Text>
                {item.actual ? <Text style={[type.caption, { color: colors.gain }]}>Actual: {item.actual}</Text> : null}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={[type.caption, { textAlign: 'center', marginTop: spacing.xl }]}>No events to show.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  impactDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm, marginTop: 6 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  rowBottom: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs, flexWrap: 'wrap' },
});
