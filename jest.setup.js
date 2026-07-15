/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// RNFirebase ship ESM (jest không transform node_modules) + cần native module
// → mock toàn bộ API modular mà notificationService/index.js dùng.
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'mock-fcm-token'),
  deleteToken: jest.fn(async () => {}),
  onMessage: jest.fn(() => () => {}),
  onTokenRefresh: jest.fn(() => () => {}),
  onNotificationOpenedApp: jest.fn(() => () => {}),
  getInitialNotification: jest.fn(async () => null),
  setBackgroundMessageHandler: jest.fn(),
}));

// Xin quyền notification giờ đi qua react-native-permissions (native module)
jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock'),
);
