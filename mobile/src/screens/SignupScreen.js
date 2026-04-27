import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import GradientButton from '../components/GradientButton';
import Brand from '../components/Brand';
import { colors, radius } from '../theme';
import { SERVER_URL } from '../config';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPass) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'user' }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Sign-up successful!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Failed', data.message || 'Sign-up failed');
      }
    } catch (err) {
      Alert.alert('Network error', 'Could not reach the backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll centered>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kb}
      >
        <View style={styles.brandWrap}>
          <Brand size={28} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join the Sentinel campus security system</Text>

          <View style={styles.field}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textMuted}
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
            />
          </View>

          <GradientButton
            title={loading ? 'Creating...' : 'Create Account'}
            icon={loading ? null : '→'}
            onPress={handleSignUp}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kb: { width: '100%', alignItems: 'center' },
  brandWrap: { marginBottom: 28 },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 22 },
  field: { marginBottom: 14 },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: colors.textPrimary,
    fontSize: 15,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.accentSecondary, fontSize: 14, fontWeight: '600' },
});
