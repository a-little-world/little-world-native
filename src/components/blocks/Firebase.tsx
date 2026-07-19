import { useEffect } from 'react';

import { getMessaging } from '@react-native-firebase/messaging';

import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';

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
