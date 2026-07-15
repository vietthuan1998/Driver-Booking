import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import StatusBadge from '../components/StatusBadge';
import { changePassword, signOut, updateProfile } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { CARD_SHADOW, COLORS } from '../utils/constants';
import { formatDateShort } from '../utils/helpers';

// SĐT Việt Nam: 10 số, bắt đầu bằng 0 (để trống thì được phép)
function isValidPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [signingOut, setSigningOut] = useState(false);

  // Form chỉnh sửa thông tin cá nhân
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditForm = () => {
    setEditName(profile?.full_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setEditError(null);
    setShowEditForm(true);
  };

  const handleSaveProfile = async () => {
    const name = editName.trim();
    const phone = editPhone.trim();
    if (!name) {
      setEditError('Vui lòng nhập họ tên');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setEditError('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
      return;
    }
    setEditError(null);
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ full_name: name, phone: phone || null });
      setProfile(updated);
      setShowEditForm(false);
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.');
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Cập nhật thông tin thất bại');
    } finally {
      setSavingProfile(false);
    }
  };

  // Form đổi mật khẩu
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ các trường');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu nhập lại không khớp');
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      resetPasswordForm();
      setShowPasswordForm(false);
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi.');
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Đổi mật khẩu thất bại');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            // authStore sẽ tự chuyển về màn Login qua onAuthStateChange
          } catch {
            setSigningOut(false);
            Alert.alert('Lỗi', 'Đăng xuất thất bại, vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  if (!profile) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.full_name
              .split(' ')
              .slice(-1)[0]
              ?.charAt(0)
              .toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile.full_name}</Text>
        <StatusBadge
          label={profile.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          color={profile.status === 'active' ? COLORS.success : COLORS.textMuted}
        />
      </View>

      <View style={styles.card}>
        <InfoRow label="Email" value={session?.user.email ?? '—'} />
        <InfoRow label="Số điện thoại" value={profile.phone ?? '—'} />
        <InfoRow label="Vai trò" value="Tài xế" />
        <InfoRow label="Ngày tham gia" value={formatDateShort(profile.created_at)} />
      </View>

      <View style={[styles.card, styles.cardLeft]}>
        <Pressable
          style={styles.passwordToggle}
          onPress={() => {
            if (showEditForm) setShowEditForm(false);
            else openEditForm();
          }}
        >
          <Text style={styles.passwordToggleText}>✏️ Chỉnh sửa thông tin</Text>
          <Text style={styles.passwordToggleArrow}>{showEditForm ? '˄' : '˅'}</Text>
        </Pressable>

        {showEditForm && (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor="#9aa4b8"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại (không bắt buộc)"
              placeholderTextColor="#9aa4b8"
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />

            {editError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{editError}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || savingProfile) && styles.pressed,
              ]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Lưu thông tin</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={[styles.card, styles.cardLeft]}>
        <Pressable
          style={styles.passwordToggle}
          onPress={() => {
            if (showPasswordForm) resetPasswordForm();
            setShowPasswordForm((v) => !v);
          }}
        >
          <Text style={styles.passwordToggleText}>🔒 Đổi mật khẩu</Text>
          <Text style={styles.passwordToggleArrow}>{showPasswordForm ? '˄' : '˅'}</Text>
        </Pressable>

        {showPasswordForm && (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor="#9aa4b8"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
              placeholderTextColor="#9aa4b8"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="#9aa4b8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {passwordError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || changingPassword) && styles.pressed,
              ]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Xác nhận đổi mật khẩu</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, (pressed || signingOut) && styles.pressed]}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <Text style={styles.signOutText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    ...CARD_SHADOW,
  },
  cardLeft: { alignItems: 'stretch' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.primarySoft,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, color: COLORS.textMuted },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  passwordToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordToggleText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  passwordToggleArrow: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  passwordForm: { gap: 10, marginTop: 12 },
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
  errorText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
  },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  signOut: {
    borderRadius: 14,
    backgroundColor: COLORS.dangerSoft,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
