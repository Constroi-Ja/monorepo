import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { InfoBox } from './InfoBox';

interface PixQRCardProps {
  qrCodeBase64: string;
  qrCodeText: string;
  expiresInMinutes?: number;
}

export function PixQRCard({ qrCodeBase64, qrCodeText, expiresInMinutes = 15 }: PixQRCardProps) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresInMinutes * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(qrCodeText);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const expired = secondsLeft === 0;

  return (
    <View style={styles.container}>
      <InfoBox
        type="info"
        message="Abra o app do seu banco, vá em PIX > Pagar e escaneie o código abaixo."
      />

      <View style={styles.qrWrapper}>
        {!expired && qrCodeBase64 ? (
          <Image
            source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
            style={styles.qrCode}
            contentFit="contain"
          />
        ) : (
          <View style={styles.qrExpired}>
            <Text style={styles.qrExpiredText}>QR Code expirado</Text>
          </View>
        )}
      </View>

      <View style={styles.timerRow}>
        <Text style={[styles.timer, expired && styles.timerExpired]}>
          {expired ? 'Expirado' : `Expira em ${timeStr}`}
        </Text>
      </View>

      <Pressable onPress={handleCopy} style={[styles.copyButton, copied && styles.copyButtonCopied]}>
        <Text style={styles.copyText}>
          {copied ? '✓ Copiado!' : 'Copiar código PIX'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing[4] },
  qrWrapper: {
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  qrCode: { width: 240, height: 240 },
  qrExpired: {
    width: 240,
    height: 240,
    backgroundColor: Colors.neutral[100],
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrExpiredText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.neutral[500],
  },
  timerRow: { alignItems: 'center' },
  timer: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.neutral[600],
  },
  timerExpired: { color: Colors.error.base },
  copyButton: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonCopied: {
    borderColor: Colors.success.base,
    backgroundColor: Colors.success.light,
  },
  copyText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.brand[500],
  },
});
