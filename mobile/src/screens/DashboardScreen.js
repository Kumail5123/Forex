import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { registerForPushNotifications } from '../api/pushNotifications';
import { colors, spacing, type, radius } from '../theme/theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [prices, setPrices] = useState({});
  const [positions, setPositions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [{ prices: freshPrices }, { positions: freshPositions }, { pairs }] = await Promise.all([
        api.getDemoPrices(),
        api.getDemoPositions(),
        api.getWatchlist(),
      ]);
      setPrices(freshPrices);
      setPositions(freshPositions);
      setWatchlist(pairs);
    } catch (err) {
      // Silent — a failed background refresh shouldn't interrupt the user.
    }
  }, []);

  useEffect(() => {
    loadData();
    registerForPushNotifications();
    const interval = setInterval(loadData, 4000); // simple polling for "live" prices
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser()]);
    setRefreshing(false);
  };

  const placeOrder = async (pair, side) => {
    try {
      await api.placeDemoOrder({ pair, side, units: 1000 });
      await loadData();
    } catch (err) {
      Alert.alert('Order failed', err.message);
    }
  };

  const closePosition = async (id) => {
    try {
      const { closedPosition } = await api.closeDemoPosition(id);
      await Promise.all([loadData(), refreshUser()]);
      Alert.alert(
        closedPosition.pnl >= 0 ? 'Position closed — profit' : 'Position closed — loss',
        `P&L: ${closedPosition.pnl >= 0 ? '+' : ''}$${closedPosition.pnl}`
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const toggleWatchlist = async (pair) => {
    try {
      if (watchlist.includes(pair)) {
        const { pairs } = await api.removeFromWatchlist(pair);
        setWatchlist(pairs);
      } else {
        const { pairs } = await api.addToWatchlist(pair);
        setWatchlist(pairs);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={type.caption}>Welcome back</Text>
          <Text style={type.title}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: colors.loss }}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={type.caption}>Demo balance</Text>
        <Text style={styles.balanceText}>${user?.demoBalance?.toFixed(2) ?? '0.00'}</Text>
        <TouchableOpacity style={styles.connectBrokerLink} onPress={() => navigation.navigate('BrokerConnect')}>
          <Text style={{ color: colors.accent }}>
            {user?.brokerConnected ? 'Manage broker connection →' : 'Connect a broker for live trading →'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <TouchableOpacity style={[styles.calendarLink, { flex: 1 }]} onPress={() => navigation.navigate('Calendar')}>
          <Text style={type.body}>📅 Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.calendarLink, { flex: 1 }]} onPress={() => navigation.navigate('History')}>
          <Text style={type.body}>📜 History</Text>
        </TouchableOpacity>
      </View>

      <Text style={[type.title, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Markets</Text>
      <FlatList
        data={Object.entries(prices)}
        keyExtractor={([pair]) => pair}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        renderItem={({ item: [pair, price] }) => (
          <View style={styles.priceRow}>
            <TouchableOpacity onPress={() => toggleWatchlist(pair)} style={{ marginRight: spacing.sm }}>
              <Text style={{ fontSize: 16, color: watchlist.includes(pair) ? colors.warning : colors.textSecondary }}>
                {watchlist.includes(pair) ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
            <Text style={[type.body, { flex: 1 }]}>{pair}</Text>
            <Text style={[type.mono, { marginRight: spacing.sm }]}>{price}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={styles.sellButton} onPress={() => placeOrder(pair, 'sell')}>
                <Text style={styles.tradeButtonText}>Sell</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyButton} onPress={() => placeOrder(pair, 'buy')}>
                <Text style={styles.tradeButtonText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            <Text style={[type.title, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Open positions</Text>
            {positions.length === 0 ? (
              <Text style={type.caption}>No open positions yet. Tap Buy or Sell above to practice.</Text>
            ) : (
              positions.map((p) => (
                <View key={p.id} style={styles.positionRow}>
                  <View>
                    <Text style={type.body}>
                      {p.pair} · {p.side.toUpperCase()} · {p.units} units
                    </Text>
                    <Text style={type.caption}>Entry {p.entryPrice}</Text>
                  </View>
                  <TouchableOpacity onPress={() => closePosition(p.id)}>
                    <Text style={{ color: colors.accent }}>Close</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  balanceCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  balanceText: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  connectBrokerLink: { marginTop: spacing.sm },
  calendarLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceRow: {
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
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  buyButton: { backgroundColor: colors.gain, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  sellButton: { backgroundColor: colors.loss, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  tradeButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
