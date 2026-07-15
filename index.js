/**
 * @format
 */

import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// FCM: phải đăng ký background handler ngoài cây component (chạy cả khi app
// ở background/quit). Noti dạng notification hệ thống tự hiện, không cần xử lý.
setBackgroundMessageHandler(getMessaging(), async () => {});

AppRegistry.registerComponent(appName, () => App);
