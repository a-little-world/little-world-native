import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { IosAuthorizationStatus } from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { useEffect } from "react";
import { Platform } from "react-native";
import { registerFirebaseDeviceToken } from "./firebase-util";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data }) => {
    console.log("Received a notification task payload!", data);
    const isNotificationResponse = "actionIdentifier" in data;
    if (isNotificationResponse) {
      // Do something with the notification response from user
    } else {
      // Do something with the data from notification that was received
    }
  },
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log("received notification in foreground handler");
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

interface FirebasePushNotificationData {
  headline: string;
  title: string;
  description: string;
  timestamp: string;
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function requestPermissionIOS(): Promise<boolean> {
  let permission = await Notifications.getPermissionsAsync();

  if (permission.ios?.status === IosAuthorizationStatus.NOT_DETERMINED) {
    permission = await Notifications.requestPermissionsAsync();
  }

  const allowedStatuses: IosAuthorizationStatus[] = [
    IosAuthorizationStatus.AUTHORIZED,
    IosAuthorizationStatus.EPHEMERAL,
    IosAuthorizationStatus.PROVISIONAL,
  ];

  return (
    permission.ios !== undefined &&
    allowedStatuses.includes(permission.ios.status)
  );
}

async function requestPermissionAndroid(): Promise<boolean> {
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });

  let permission = await Notifications.getPermissionsAsync();

  if (permission.status === PermissionStatus.UNDETERMINED) {
    permission = await Notifications.requestPermissionsAsync();
  }

  return permission.status === PermissionStatus.GRANTED;
}

async function requestUserPermission() {
  console.log("isDevice", Device.isDevice);
  if (!Device.isDevice) {
    return false;
  }

  if (Platform.OS === "android") {
    return requestPermissionAndroid();
  } else if (Platform.OS === "ios") {
    return requestPermissionIOS();
  } else {
    console.log("notifications not supported on platform:", Platform.OS);
    return false;
  }
}

async function register(): Promise<void> {
  const permission = await requestUserPermission();
  console.log("has notificaiton permissions", permission);

  const token = await getToken(getMessaging());

  console.log("notifcation token", token);

  await registerFirebaseDeviceToken(token);
}

function FireBase() {
  useEffect(() => {
    console.log("firebase");
  }, []);

  useEffect(() => {
    register();

    console.log("registering push notifications");

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("received notification", notification);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("clicked notification", response);
      });

    const tokenRefresUnsubscribe = onTokenRefresh(getMessaging(getApp()), () =>
      register(),
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
      tokenRefresUnsubscribe();
    };
  }, []);

  return <></>;
}

export default FireBase;
