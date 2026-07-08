# Driver — App tài xế CarBooking

Ứng dụng React Native dành cho **tài xế** của hệ thống xe ghép Huế ↔ Đà Nẵng/Hội An. Dùng chung backend Supabase với web admin (`~/Project/CarBooking`), RLS giới hạn quyền theo role `driver`.

## Tính năng

- **Đăng nhập** — chỉ tài khoản `role=driver`, `status=active` (tài khoản admin/staff bị từ chối, hướng dẫn dùng web).
- **Trang chủ** — thống kê chuyến hôm nay (tổng / đang chạy / hoàn thành), chuyến đang chạy và sắp tới.
- **Chuyến đi** — xem chuyến theo ngày (chuyển ngày trước/sau), pull-to-refresh.
- **Chi tiết chuyến** — thông tin tuyến/xe/giờ, danh sách hành khách theo booking (ghế, điểm đón/trả, gọi điện trực tiếp); nút **Bắt đầu chuyến** (`scheduled → in_progress`, ghi `actual_departure_time`) và **Hoàn thành chuyến** (`in_progress → completed`, ghi `actual_arrival_time`).
- **Xe của tôi** — xem xe được gán; nếu chưa có xe: tự đăng ký (biển số, tên xe, 4/7 chỗ → `status=pending` chờ admin duyệt); sửa/xóa khi còn chờ duyệt (không đổi được số chỗ — trigger DB chặn).
- **Cá nhân** — hồ sơ + đăng xuất.

## Kiến trúc

`screens → services → supabase client` (giống web admin; component không gọi supabase trực tiếp).

```
src/
  utils/        config.ts (Supabase URL + anon key), supabase.ts, constants.ts (label VN), helpers.ts (ngày local → ISO)
  types/        Profile, Vehicle, Route, Trip, TripSeatRow...
  services/     authService, tripService, vehicleService
  stores/       authStore.ts (Zustand, onAuthStateChange, chặn non-driver)
  navigation/   RootNavigator (Login ↔ Bottom tabs + TripDetail)
  screens/      Login, Home, Trips, TripDetail, Vehicle, Profile
  components/   TripCard, StatusBadge, EmptyState, LoadingView
```

Lưu ý nghiệp vụ (đồng bộ với CLAUDE.md của CarBooking):
- Lọc theo ngày: boundary theo **local time** rồi `.toISOString()` cho cột `timestamptz`.
- `seat_order = 1` là ghế tài xế, không tính vào sức chứa khách.
- RLS chỉ cho driver đổi `trip_status` / `actual_*` trên trips của mình.

## Chạy app

```bash
npm install

# Android
npx react-native run-android

# iOS
cd ios && bundle install && bundle exec pod install && cd ..
npx react-native run-ios
```

## Kiểm tra

```bash
npm run lint
npx tsc --noEmit
npm test
```
