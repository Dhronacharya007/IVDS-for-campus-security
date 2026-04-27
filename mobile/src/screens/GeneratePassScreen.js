import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import GradientButton from '../components/GradientButton';
import { colors, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode } from '../mockData';

export default function GeneratePassScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', phone: '', in_time: '', out_time: '' });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const generate = async () => {
    if (!form.name || !form.phone || !form.in_time || !form.out_time) {
      Alert.alert('Missing fields', 'Please fill all fields.');
      return;
    }
    const demo = await isDemoMode();
    if (demo) {
      Alert.alert('Pass generated', 'Visitor pass generated! (Demo Mode)');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/generate-pass`, form);
      Alert.alert('Success', 'Visitor pass generated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to generate pass');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ marginBottom: 20 }}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <PageHeader
          eyebrow="VISITOR MANAGEMENT"
          title="Generate Visitor Pass"
          subtitle="Issue a digital pass for an upcoming visitor."
        />

        <View style={styles.card}>
          <Field label="VISITOR NAME" value={form.name} onChangeText={v => set('name', v)} placeholder="e.g. John Smith" />
          <Field label="PHONE NUMBER" value={form.phone} onChangeText={v => set('phone', v)} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
          <Field label="CHECK-IN TIME" value={form.in_time} onChangeText={v => set('in_time', v)} placeholder="2026-04-27 14:30" />
          <Field label="CHECK-OUT TIME" value={form.out_time} onChangeText={v => set('out_time', v)} placeholder="2026-04-27 16:00" />

          <GradientButton
            title={loading ? 'Generating...' : 'Generate Pass'}
            icon={loading ? null : '→'}
            onPress={generate}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  field: { marginBottom: 12 },
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
});
