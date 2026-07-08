import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StatusBadge from '../components/StatusBadge';
import LoadingView from '../components/LoadingView';
import {
  deletePendingVehicle,
  getMyVehicle,
  registerVehicle,
  updatePendingVehicle,
} from '../services/vehicleService';
import type { Vehicle } from '../types';
import { CARD_SHADOW, COLORS, VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL } from '../utils/constants';

export default function VehicleScreen() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form đăng ký / sửa xe
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [seatCount, setSeatCount] = useState<4 | 7>(4);

  const load = useCallback(async () => {
    try {
      setError(null);
      const v = await getMyVehicle();
      setVehicle(v);
      if (v) {
        setPlateNumber(v.plate_number);
        setVehicleName(v.vehicle_name);
        setSeatCount(v.seat_count);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRegister = async () => {
    if (!plateNumber.trim() || !vehicleName.trim()) {
      setError('Vui lòng nhập biển số và tên xe');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await registerVehicle({
        plate_number: plateNumber.trim().toUpperCase(),
        vehicle_name: vehicleName.trim(),
        seat_count: seatCount,
      });
      await load();
      Alert.alert('Đã gửi đăng ký', 'Xe của bạn đang chờ quản trị viên duyệt.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!vehicle) return;
    if (!plateNumber.trim() || !vehicleName.trim()) {
      setError('Vui lòng nhập biển số và tên xe');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updatePendingVehicle(vehicle.id, {
        plate_number: plateNumber.trim().toUpperCase(),
        vehicle_name: vehicleName.trim(),
      });
      setEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!vehicle) return;
    Alert.alert('Xóa đăng ký xe', 'Bạn chắc chắn muốn xóa đăng ký xe này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          setError(null);
          try {
            await deletePendingVehicle(vehicle.id);
            setVehicle(null);
            setPlateNumber('');
            setVehicleName('');
            setSeatCount(4);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const isPending = vehicle?.status === 'pending';
  const showForm = !vehicle || (isPending && editing);

  // Chưa tải xong lần đầu thì chưa biết có xe hay không — tránh nháy form đăng ký
  if (loading && !vehicle) return <LoadingView />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {error && <Text style={styles.error}>{error}</Text>}

      {vehicle && !showForm && (
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.plate}>{vehicle.plate_number}</Text>
            <StatusBadge
              label={VEHICLE_STATUS_LABEL[vehicle.status]}
              color={VEHICLE_STATUS_COLOR[vehicle.status]}
            />
          </View>
          <Text style={styles.name}>{vehicle.vehicle_name}</Text>
          <Text style={styles.muted}>Số chỗ: {vehicle.seat_count} khách</Text>
          {isPending && (
            <>
              <Text style={styles.pendingNote}>
                Xe đang chờ quản trị viên duyệt. Bạn có thể sửa hoặc xóa trong lúc chờ.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.buttonOutline]} onPress={() => setEditing(true)}>
                  <Text style={styles.buttonOutlineText}>Sửa</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonDanger]}
                  onPress={handleDelete}
                  disabled={submitting}
                >
                  <Text style={styles.buttonText}>Xóa</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {showForm && (
        <View style={styles.card}>
          <Text style={styles.formTitle}>{vehicle ? 'Sửa thông tin xe' : 'Đăng ký xe của bạn'}</Text>
          {!vehicle && (
            <Text style={styles.muted}>
              Bạn chưa có xe trong hệ thống. Đăng ký xe để quản trị viên duyệt và xếp chuyến.
            </Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Biển số xe (VD: 75A-123.45)"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            value={plateNumber}
            onChangeText={setPlateNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Tên xe (VD: Toyota Vios trắng)"
            placeholderTextColor={COLORS.textMuted}
            value={vehicleName}
            onChangeText={setVehicleName}
          />
          {!vehicle && (
            <View style={styles.seatRow}>
              {([4, 7] as const).map((n) => (
                <Pressable
                  key={n}
                  style={[styles.seatOption, seatCount === n && styles.seatOptionActive]}
                  onPress={() => setSeatCount(n)}
                >
                  <Text style={[styles.seatOptionText, seatCount === n && styles.seatOptionTextActive]}>
                    {n} chỗ
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.button, styles.buttonPrimary, (pressed || submitting) && styles.pressed]}
            onPress={vehicle ? handleUpdate : handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{vehicle ? 'Lưu thay đổi' : 'Gửi đăng ký'}</Text>
            )}
          </Pressable>
          {vehicle && (
            <Pressable style={[styles.button, styles.buttonOutline]} onPress={() => setEditing(false)}>
              <Text style={styles.buttonOutlineText}>Hủy</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    ...CARD_SHADOW,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plate: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.textMuted },
  pendingNote: {
    fontSize: 13,
    color: COLORS.warning,
    backgroundColor: COLORS.warning + '14',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
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
  seatRow: { flexDirection: 'row', gap: 10 },
  seatOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  seatOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  seatOptionText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  seatOptionTextActive: { color: COLORS.primary },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: COLORS.primary, flexGrow: 0, flexBasis: 'auto' },
  buttonDanger: { backgroundColor: COLORS.danger },
  buttonOutline: { borderWidth: 1.5, borderColor: COLORS.border },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  buttonOutlineText: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  error: { color: COLORS.danger, marginBottom: 10 },
});
