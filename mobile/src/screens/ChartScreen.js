import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api/client';
import { colors, spacing, type, radius } from '../theme/theme';

const CHART_HEIGHT = 220;

function Candlestick({ candle, minPrice, maxPrice }) {
  const range = maxPrice - minPrice || 1;
  const toY = (price) => CHART_HEIGHT - ((price - minPrice) / range) * CHART_HEIGHT;

  const isGain = candle.close >= candle.open;
  const color = isGain ? colors.gain : colors.loss;

  const wickTop = toY(candle.high);
  const wickBottom = toY(candle.low);
  const bodyTop = toY(Math.max(candle.open, candle.close));
  const bodyBottom = toY(Math.min(candle.open, candle.close));

  return (
    <View style={styles.candleColumn}>
      <View style={[styles.wick, { top: wickTop, height: Math.max(1, wickBottom - wickTop), backgroundColor: color }]} />
      <View style={[styles.body, { top: bodyTop, height: Math.max(2, bodyBottom - bodyTop), backgroundColor: color }]} />
    </View>
  );
}

export default function ChartScreen({ route, navigation }) {
  const { pair } = route.params;
  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const candlesRef = useRef([]);

  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [units, setUnits] = useState('1000');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { candles: fresh } = await api.getCandles(pair, 40);
        candlesRef.current = fresh;
        setCandles(fresh);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pair]);

  const pollPrice = useCallback(async () => {
    try {
      const { prices } = await api.getDemoPrices();
      const price = prices[pair];
      if (!price || candlesRef.current.length === 0) return;

      setCurrentPrice(price);

      const updated = [...candlesRef.current];
      const last = { ...updated[updated.length - 1] };
      last.close = price;
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      updated[updated.length - 1] = last;

      candlesRef.current = updated;
      setCandles(updated);
    } catch (err) {
      // Silent
    }
  }, [pair]);

  useEffect(() => {
    pollPrice();
    const interval = setInterval(pollPrice, 3000);
    return () => clearInterval(interval);
  }, [pollPrice]);

  const handleSubmit = async () => {
    const unitsNum = parseFloat(units);
    if (!unitsNum || unitsNum <= 0) {
      Alert.alert('Invalid units', 'Enter a positive number of units.');
      return;
    }
    if (orderType === 'limit' && (!targetPrice || parseFloat(targetPrice) <= 0)) {
      Alert.alert('Missing target price', 'Enter a target price for the limit order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pair,
        side,
        units: unitsNum,
        orderType,
        targetPrice: orderType === 'limit' ? parseFloat(targetPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      };
      await api.placeDemoOrder(payload);
      Alert.alert(
        orderType === 'limit' ? 'Limit order placed' : 'Position opened',
        orderType === 'limit'
          ? `Will fill when ${pair} reaches ${targetPrice}`
          : `${side.toUpperCase()} ${unitsNum} units of ${pair}`
      );
      setTargetPrice('');
      setStopLoss('');
      setTakeProfit('');
    } catch (err) {
      Alert.alert('Order failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length ? Math.max(...allPrices) : 1;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={type.title}>{pair}</Text>
        <View style={{ width: 50 }} />
      </View>

      {currentPrice ? <Text style={styles.currentPrice}>{currentPrice}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />
      ) : (
        <View style={styles.chartArea}>
          {candles.map((c, i) => (
            <Candlestick key={i} candle={c} minPrice={minPrice} maxPrice={maxPrice} />
          ))}
        </View>
      )}

      <View style={styles.orderCard}>
        <Text style={type.title}>Place order</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, orderType === 'market' && styles.toggleButtonActive]}
            onPress={() => setOrderType('market')}
          >
            <Text style={orderType === 'market' ? styles.toggleTextActive : styles.toggleText}>Market</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, orderType === 'limit' && styles.toggleButtonActive]}
            onPress={() => setOrderType('limit')}
          >
            <Text style={orderType === 'limit' ? styles.toggleTextActive : styles.toggleText}>Limit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, side === 'buy' && { backgroundColor: colors.gain }]}
            onPress={() => setSide('buy')}
          >
            <Text style={styles.toggleTextActive}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, side === 'sell' && { backgroundColor: colors.loss }]}
            onPress={() => setSide('sell')}
          >
            <Text style={styles.toggleTextActive}>Sell</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Units</Text>
        <TextInput style={styles.input} value={units} onChangeText={setUnits} keyboardType="numeric" />

        {orderType === 'limit' && (
          <>
            <Text style={styles.label}>Target price (fills when reached)</Text>
            <TextInput style={styles.input} value={targetPrice} onChangeText={setTargetPrice} keyboardType="numeric" placeholder={`e.g. ${currentPrice}`} placeholderTextColor={colors.textSecondary} />
          </>
        )}

        <Text style={styles.label}>Stop-loss (optional)</Text>
        <TextInput style={styles.input} value={stopLoss} onChangeText={setStopLoss} keyboardType="numeric" placeholder="Price to auto-close at a loss" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Take-profit (optional)</Text>
        <TextInput style={styles.input} value={takeProfit} onChangeText={setTakeProfit} keyboardType="numeric" placeholder="Price to auto-close at a profit" placeholderTextColor={colors.textSecondary} />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{orderType === 'limit' ? 'Place limit order' : `${side === 'buy' ? 'Buy' : 'Sell'} now`}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  currentPrice: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  chartArea: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  candleColumn: { width: 8, height: CHART_HEIGHT, marginHorizontal: 1 },
  wick: { position: 'absolute', width: 2, left: 3 },
  body: { position: 'absolute', width: 8, borderRadius: 1 },
  orderCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.xl },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xs },
  toggleButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  label: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  submitButton: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
