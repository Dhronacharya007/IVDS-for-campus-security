import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import GradientButton from '../components/GradientButton';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode } from '../mockData';

export default function ScanOutScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const handleScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setScanResult(data);
    const qr_id = data.replace('visitor:', '');

    const demo = await isDemoMode();
    if (demo) {
      Alert.alert('Success', 'Out-Time Scan Successful (Demo Mode)');
      return;
    }
    try {
      await axios.post(`${SERVER_URL}/scan-out`, { visitor_id: qr_id });
      Alert.alert('Success', 'Out-Time Scan Successful');
    } catch {
      Alert.alert('Failed', 'Out-Time scan failed');
    }
  };

  const reset = () => {
    setScanned(false);
    setScanResult(null);
  };

  return (
    <ScreenContainer scroll={false}>
      <View style={{ marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <PageHeader
        eyebrow="VISITOR CHECK-OUT"
        title="Scan Out Visitor"
        subtitle="Point the camera at the visitor's QR pass to record exit."
      />

      <View style={styles.card}>
        {!permission ? (
          <Text style={styles.muted}>Loading camera...</Text>
        ) : !permission.granted ? (
          <View style={styles.permWrap}>
            <Text style={styles.permTitle}>Camera permission needed</Text>
            <Text style={styles.permSub}>Allow Sentinel to use your camera to scan QR codes.</Text>
            <GradientButton title="Grant access" onPress={requestPermission} style={{ marginTop: 16 }} />
          </View>
        ) : scanResult ? (
          <View style={styles.successBox}>
            <LinearGradient colors={gradients.primary} style={styles.successIcon}>
              <Text style={styles.successCheck}>✓</Text>
            </LinearGradient>
            <Text style={styles.successTitle}>Visitor Checked Out</Text>
            <Text style={styles.successText}>{scanResult}</Text>
            <GradientButton title="Scan Another" onPress={reset} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <>
            <View style={styles.scannerFrame}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleScanned}
              />
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <View style={styles.hintRow}>
              <View style={styles.purpleDot} />
              <Text style={styles.hintText}>Scanner active — align the QR code inside the frame</Text>
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  muted: { color: colors.textSecondary, padding: 20, textAlign: 'center' },
  permWrap: { padding: 24, alignItems: 'center' },
  permTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  permSub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  scannerFrame: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    position: 'relative',
  },
  camera: { ...StyleSheet.absoluteFillObject },
  cornerTL: { position: 'absolute', top: 14, left: 14, width: 28, height: 28, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.accentPrimary, borderTopLeftRadius: 8 },
  cornerTR: { position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.accentPrimary, borderTopRightRadius: 8 },
  cornerBL: { position: 'absolute', bottom: 14, left: 14, width: 28, height: 28, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.accentPrimary, borderBottomLeftRadius: 8 },
  cornerBR: { position: 'absolute', bottom: 14, right: 14, width: 28, height: 28, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.accentPrimary, borderBottomRightRadius: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  purpleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentPrimary },
  hintText: { color: colors.textSecondary, fontSize: 13 },
  successBox: { alignItems: 'center', padding: 20 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  successCheck: { color: '#fff', fontSize: 40, fontWeight: '900' },
  successTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  successText: { color: colors.textSecondary, fontSize: 13, marginBottom: 20, textAlign: 'center' },
});
