import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signIn } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { CARD_SHADOW, COLORS } from '../utils/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('driver5@gmail.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const authError = useAuthStore((s) => s.authError);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);

  // Nền xanh đậm nên dùng status bar chữ trắng
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    return () => StatusBar.setBarStyle('dark-content');
  }, []);

  // Lỗi từ store (sai role / bị khóa) hiển thị như lỗi form
  useEffect(() => {
    if (authError) {
      setError(authError);
      setSubmitting(false);
      clearAuthError();
    }
  }, [authError, clearAuthError]);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // Điều hướng do authStore/RootNavigator xử lý khi profile hợp lệ
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại');
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Text style={styles.logo}>🚐</Text>
        </View>
        <Text style={styles.title}>Xe ghép Huế – Đà Nẵng</Text>
        <Text style={styles.subtitle}>Ứng dụng dành cho tài xế</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Đăng nhập</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="taixe@email.com"
            placeholderTextColor="#9aa4b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9aa4b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.button, (pressed || submitting) && styles.buttonPressed]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    padding: 24,
  },
  brand: { alignItems: 'center', marginBottom: 28, gap: 4 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: { fontSize: 42 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#bfd3ff', textAlign: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    gap: 14,
    ...CARD_SHADOW,
    shadowOpacity: 0.25,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#f8fafc',
  },
  errorBox: {
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
