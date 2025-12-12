import messaging, {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";

import { useEffect, useRef } from "react";

import { useAppStore } from "@/src/store/store";
import { Unsubscribe } from "firebase/messaging";
import { Alert } from "react-native";
import {
  registerFirebaseDeviceToken,
  unregisterFirebaseDeviceToken,
} from "./firebase-util";

interface FirebasePushNotificationData {
  headline: string;
  title: string;
  description: string;
  timestamp: string;
}

async function requestUserPermission() {
  console.log("requesting notification permission for platform", Platform.OS);
  if (Platform.OS === "ios") {
    return requestPermissionIOS();
  }
  if (Platform.OS === "android") {
    return requestPermissionAndroid();
  }
  return false;
}

async function requestPermissionIOS(): Promise<boolean> {
  const authStatus = await requestPermission(getMessaging(), {
    alert: true,
    announcement: false,
    badge: true,
    carPlay: true,
    criticalAlert: false,
    provisional: false,
    sound: true,
  });

  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  return enabled;
}

function setupMessageListeners() {
  setBackgroundMessageHandler(messaging(), async (remoteMessage) => {
    console.log("Background message handler!", remoteMessage);
    const data = remoteMessage.data as unknown as FirebasePushNotificationData;
    Alert.alert(
      `Background message handler! Headline: ${data?.headline}; Title: ${data?.title}`,
      data?.description
    );
  });

  const unsubscribeOnMessage = onMessage(messaging(), async (remoteMessage) => {
    console.log("A new FCM message arrived!", remoteMessage);
    const data = remoteMessage.data as unknown as FirebasePushNotificationData;
    Alert.alert(
      `Foreground message handler! Headline: ${data?.headline}; Title: ${data?.title}`,
      data?.description
    );
  });

  const unsbuscribeOnNotificationOpenedApp = onNotificationOpenedApp(
    messaging(),
    (remoteMessage) => {
      console.log(
        "Notification caused app to open from background state:",
        remoteMessage
      );
      const data =
        remoteMessage.data as unknown as FirebasePushNotificationData;
      Alert.alert(
        `Notification opened App handler! Headline: ${data?.headline}; Title: ${data?.title}`,
        data?.description
      );
    }
  );

  // Check if app was opened from notification when app was quit
  getInitialNotification(messaging()).then((remoteMessage) => {
    if (remoteMessage) {
      console.log(
        "Notification caused app to open from quit state:",
        remoteMessage
      );
      const data =
        remoteMessage.data as unknown as FirebasePushNotificationData;
      Alert.alert(
        `Notification cause app to open handler! Headline: ${data?.headline}; Title: ${data?.title}`,
        data?.description
      );
    }
  });

  const unsubscribeTokenRefresh = onTokenRefresh(messaging(), (token) => {
    console.log("FCM token refreshed:", token);
    // Send new token to server
    registerFirebaseDeviceToken(token);
  });

  return () => {
    unsubscribeOnMessage();
    unsbuscribeOnNotificationOpenedApp();
    unsubscribeTokenRefresh();
  };
}

async function requestPermissionAndroid(): Promise<boolean> {
  const permissionStatus = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  if (permissionStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    /// save that and never ask again
  }
  return permissionStatus === PermissionsAndroid.RESULTS.GRANTED;
}

async function register(): Promise<boolean> {
  const permission = await requestUserPermission();
  if (!permission) {
    return false;
  }

  const token = await messaging().getToken();

  try {
    await registerFirebaseDeviceToken(token);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function unregister() {
  const token = await messaging().getToken();

  await unregisterFirebaseDeviceToken(token);
}

function FireBase() {
  useEffect(() => {
    console.log("friebase");
  }, []);
  const appStore = useAppStore();

  const notificationsEnabled = appStore.notificationsEnabled;
  const unsubscribeRef = useRef<Unsubscribe>(undefined);

  useEffect(() => {
    const unsubscribe = () => {
      unsubscribeRef.current?.();
    };

    console.log(`notifications enabled: ${notificationsEnabled}`);
    if (notificationsEnabled) {
      unsubscribeRef.current = setupMessageListeners();
      register().then((registered) => {
        console.log("registered", registered);
        if (!registered) {
          return;
        }
      });
    } else {
      unsubscribeRef.current?.();
      unsubscribeRef.current = undefined;

      unregister();
    }

    return unsubscribe;
  }, [notificationsEnabled]);

  return <></>;
}

export default FireBase;
