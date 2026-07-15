# Hướng dẫn cấu hình Firebase (FCM) cho hệ thống

Code đã tích hợp sẵn ở cả 2 phía:

- **Backend (repo CarBooking)**: bảng `device_tokens` + `_shared/push.ts`, các edge function `schedule-trip` / `create-booking` / `cancel-booking` tự gửi push cho tài xế (chủ xe của chuyến).
- **App Driver (repo này)**: đăng ký FCM token sau login, xóa token khi logout, hiện Alert khi app đang mở, bấm noti mở thẳng chi tiết chuyến.

Chưa cấu hình Firebase thì backend tự bỏ qua việc gửi push (không lỗi), nhưng **app Android/iOS sẽ không build được** vì thiếu file config. Làm theo các bước dưới.

## 1. Tạo Firebase project

1. Vào <https://console.firebase.google.com> → **Add project** → đặt tên (VD `carbooking-hue`).
2. Tắt Google Analytics (không cần) → **Create project**.

## 2. Đăng ký app Android

1. Trong project → biểu tượng **Android** → **Register app**.
2. **Android package name**: `com.driver` (phải khớp `applicationId` trong `android/app/build.gradle`).
3. Tải **`google-services.json`** → đặt vào **`android/app/google-services.json`** của repo này.
4. Bỏ qua các bước "Add Firebase SDK" trên console — gradle đã config sẵn (`com.google.gms.google-services`).

> Không có file này thì `npx react-native run-android` fail ngay ở bước gradle.

## 3. Đăng ký app iOS

1. Trong project → **Add app** → **iOS**.
2. **Bundle ID**: mở `ios/Driver.xcodeproj` trong Xcode xem `PRODUCT_BUNDLE_IDENTIFIER` (mặc định RN là `org.reactjs.native.example.Driver` — nên đổi thành `com.driver` trước).
3. Tải **`GoogleService-Info.plist`** → kéo thả vào Xcode, target `Driver`, tick **Copy items if needed** (phải add qua Xcode, không chỉ copy file vào thư mục).
4. Chạy `cd ios && pod install` (Podfile đã có `use_frameworks! :linkage => :static`).
5. **APNs** (bắt buộc, không có thì iOS không nhận noti nào):
   - Cần tài khoản Apple Developer trả phí.
   - Vào [developer.apple.com](https://developer.apple.com/account/resources/authkeys/list) → **Keys** → tạo key mới, tick **Apple Push Notifications service (APNs)** → tải file `.p8`.
   - Firebase console → **Project settings → Cloud Messaging → Apple app configuration** → upload file `.p8` + Key ID + Team ID.
   - Trong Xcode: target Driver → **Signing & Capabilities** → **+ Capability** → thêm **Push Notifications** và **Background Modes** (tick *Remote notifications*).

## 4. Service account cho backend (repo CarBooking)

Edge function cần service account để gọi FCM HTTP v1 API:

1. Firebase console → **Project settings → Service accounts** → **Generate new private key** → tải file JSON (VD `service-account.json`). **Không commit file này vào git.**
2. Set secret cho Supabase project:

   ```bash
   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)"
   ```

   Chạy local thì thêm vào file env của functions:

   ```bash
   # supabase/functions/.env (đã gitignore)
   FCM_SERVICE_ACCOUNT={"type":"service_account",...toàn bộ JSON 1 dòng...}
   ```

## 5. Deploy backend

Trong repo CarBooking:

```bash
supabase db push                      # migration 20260714015728_device_tokens
supabase functions deploy schedule-trip create-booking cancel-booking
```

## 6. Test end-to-end

1. Build lại app: `npx react-native run-android` (hoặc run-ios).
2. Login bằng tài khoản driver active, cho phép notification → kiểm tra bảng `device_tokens` có row mới.
3. Trên web admin: xếp 1 chuyến cho xe của driver đó (DispatchPage) → điện thoại nhận noti *"Chuyến mới được xếp cho xe của bạn"*.
4. Đặt vé lên chuyến đó (BookingsPage) → noti *"Có khách mới trên chuyến của bạn"*.
5. Hủy booking (dashboard) → noti *"Booking bị hủy"*.
6. Bấm vào noti khi app ở background → app mở đúng màn hình chi tiết chuyến.
7. Logout → row trong `device_tokens` biến mất; xếp chuyến mới → không còn nhận noti.
