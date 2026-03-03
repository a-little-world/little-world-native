import { registerFirebaseDeviceToken } from "@/src/utils/firebase-util";
import { getMessaging } from "@react-native-firebase/messaging";
import { useEffect } from "react";

function FireBase() {
  useEffect(() => {
    // const messageHandlerUnsubscribe = getMessaging().onMessage(
    //   async (remoteMessage) => {},
    // );

    const tokenRefreshUnsubscribe = getMessaging().onTokenRefresh(() =>
      registerFirebaseDeviceToken(),
    );

    return () => {
      // messageHandlerUnsubscribe();
      tokenRefreshUnsubscribe();
    };
  }, []);

  return <></>;
}

export default FireBase;
