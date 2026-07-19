import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, type, radius } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ email, password });
      // Root navigator swaps to the authenticated stack automatically.
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={type.display}>Welcome back</Text>
      <Text style={[type.caption, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Log in to your account
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryButtonText}>Log in</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ marginTop: spacing.lg }}>
        <Text style={type.caption}>
          Don't have an account? <Text style={{ color: colors.accent }}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { color: colors.loss, marginBottom: spacing.md },
});
