import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import GradientButton from '../components/GradientButton';
import Brand from '../components/Brand';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { setDemoMode } from '../mockData';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (username === 'demo' && password === 'demo') {
      await setDemoMode(true);
      navigation.replace('UserHome', { username: 'Demo User' });
      return;
    }
    if (username === 'security' && password === 'demo') {
      await setDemoMode(true);
      navigation.replace('SecurityHome');
      return;
    }
    await setDemoMode(false);
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.role === 'user') navigation.replace('UserHome', { username });
        else if (data.role === 'security') navigation.replace('SecurityHome');
      } else {
        Alert.alert('Login failed', data.error || 'Invalid username or password');
      }
    } catch (e) {
      Alert.alert('Network error', 'Could not reach the backend. Try the demo credentials below.');
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access campus security tools</Text>

          <View style={styles.field}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <GradientButton
            title={loading ? 'Signing in...' : 'Sign In'}
            icon={loading ? null : '→'}
            onPress={handleSignIn}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEMO ACCESS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoRow}>
            <Pressable
              style={styles.demoChip}
              onPress={() => { setUsername('demo'); setPassword('demo'); }}
            >
              <LinearGradient colors={gradients.primary} style={styles.demoIcon}>
                <Text style={styles.demoIconText}>U</Text>
              </LinearGradient>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.demoTitle}>User</Text>
                <Text style={styles.demoSub}>demo / demo</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.demoChip}
              onPress={() => { setUsername('security'); setPassword('demo'); }}
            >
              <LinearGradient colors={gradients.successCyan} style={styles.demoIcon}>
                <Text style={styles.demoIconText}>S</Text>
              </LinearGradient>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.demoTitle}>Security</Text>
                <Text style={styles.demoSub}>security / demo</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kb: {
    width: '100%',
    alignItems: 'center',
  },
  brandWrap: {
    marginBottom: 28,
  },
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 22,
  },
  field: {
    marginBottom: 14,
  },
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoIconText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  demoTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  demoSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.accentSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
