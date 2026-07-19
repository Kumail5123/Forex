import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../api/client';
import { colors, spacing, type, radius } from '../theme/theme';

export default function BrokerConnectScreen({ navigation }) {
  const [links, setLinks] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { links: fresh } = await api.getBrokerLinks();
      setLinks(fresh);
    } catch (err) {
      // Non-fatal — buttons just won't work until this loads.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const openLink = async (url) => {
    await WebBrowser.openBrowserAsync(url);
  };

  if (isLoading || !links) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={type.display}>Trade with real funds</Text>
      <Text style={[type.caption, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Real-money trading happens directly on AvaTrade, a licensed broker. Your account
        and funds are with AvaTrade at all times — this app never holds your money.
      </Text>

      <View style={styles.card}>
        <Text style={type.title}>Open a live AvaTrade account</Text>
        <Text style={[type.caption, { marginTop: spacing.xs, marginBottom: spacing.md }]}>
          You'll sign up directly with AvaTrade and can trade on their WebTrader, MT4, or
          MT5 platforms.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openLink(links.liveWebTrader)}>
          <Text style={styles.primaryButtonText}>Open live account (WebTrader)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => openLink(links.liveMT4)}>
          <Text style={styles.secondaryButtonText}>Open live account (MT4)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => openLink(links.liveMT5)}>
          <Text style={styles.secondaryButtonText}>Open live account (MT5)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={type.title}>Not ready for real money?</Text>
        <Text style={[type.caption, { marginTop: spacing.xs, marginBottom: spacing.md }]}>
          Practice with our built-in demo mode on the dashboard, or open a free demo account
          directly with AvaTrade.
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => openLink(links.demo)}>
          <Text style={styles.secondaryButtonText}>Open AvaTrade demo account</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }}>
        <Text style={type.caption}>Back to dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl * 1.5 },
  centered: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  primaryButton: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  secondaryButtonText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
});
