import { Platform } from 'react-native';

import {
  getMessaging,
  setBackgroundMessageHandler,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import i18next from 'i18next';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type Event as NotifeeEvent,
} from 'react-native-notify-kit';

import { apiFetch, loadStoredTokensIntoStore } from '@/src/api/helpers';
import { useAuthStore } from '@/src/store/authStore';
import {
  IncomingCall,
  useIncomingCallStore,
} from '@/src/store/incomingCallStore';

export const INCOMING_CALL_CHANNEL_ID = 'incoming_calls';
export const INCOMING_CALL_CATEGORY_ID = 'INCOMING_CALL';

export const CALL_ACTION_ACCEPT = 'accept';
export const CALL_ACTION_DECLINE = 'decline';

const PUSH_TYPE_INCOMING_CALL = 'incoming_call';
const PUSH_TYPE_CALL_CANCELLED = 'incoming_call_cancelled';

type PushData = Record<string, unknown> | undefined;

function readString(data: PushData, key: string): string | undefined {
  const value = data?.[key];
  // FCM data payloads are always string maps, but iOS alert pushes carry the
  // same fields alongside `aps`, so don't assume the type.
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function parseIncomingCall(data: PushData): IncomingCall | null {
  const roomUuid = readString(data, 'room_uuid');
  const partnerId = readString(data, 'partner_id');
  if (!roomUuid || !partnerId) {
    return null;
  }

  return {
    roomUuid,
    partnerId,
    partnerName: readString(data, 'partner_name'),
    partnerImageUrl: readString(data, 'partner_image_url'),
  };
}

/**
 * Guards the entry points that can replay an old push — iOS cold start hands
 * back the last notification response whenever it happened, and a notification
 * can sit in the Android shade indefinitely if the cancel push never arrived.
 */
function isCallPushExpired(data: PushData): boolean {
  const expiresAt = readString(data, 'expires_at');
  if (!expiresAt) {
    return false;
  }
  const expiry = Date.parse(expiresAt);
  return !Number.isNaN(expiry) && expiry < Date.now();
}

export function getCallPushType(
  data: PushData,
): 'incoming' | 'cancelled' | null {
  const type = readString(data, 'type');
  if (type === PUSH_TYPE_INCOMING_CALL) return 'incoming';
  if (type === PUSH_TYPE_CALL_CANCELLED) return 'cancelled';
  return null;
}

function translate(key: string, fallback: string): string {
  // The Android background handler runs without the app's React tree, so i18n
  // may never have been initialised in this JS context.
  return i18next.isInitialized ? i18next.t(key, fallback) : fallback;
}

async function ensureIncomingCallChannel(): Promise<void> {
  await notifee.createChannel({
    id: INCOMING_CALL_CHANNEL_ID,
    name: translate('notification_channel.incoming_calls', 'Incoming calls'),
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    visibility: AndroidVisibility.PUBLIC,
  });
}

/**
 * Android only. iOS rings from the APNs alert push itself — a local
 * notification would double up, and Notifee's iOS side would be a third
 * contender for the UNUserNotificationCenter delegate that
 * expo-notifications and RNFB messaging already share.
 */
export async function displayIncomingCallNotification(
  call: IncomingCall,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await ensureIncomingCallChannel();

  await notifee.displayNotification({
    // Keyed by room so the cancel push and a repeated ring collapse onto one.
    id: call.roomUuid,
    title: translate('call.incoming_call', 'Incoming call'),
    body: call.partnerName,
    data: { type: PUSH_TYPE_INCOMING_CALL, ...call },
    android: {
      channelId: INCOMING_CALL_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      // Ring until answered rather than chiming once.
      ongoing: true,
      autoCancel: false,
      loopSound: true,
      timestamp: Date.now(),
      showTimestamp: true,
      pressAction: { id: 'default', launchActivity: 'default' },
      // Draws over the lockscreen once MainActivity opts in via
      // showWhenLocked; until then Android falls back to a heads-up
      // notification, which still rings and still offers both actions.
      fullScreenAction: {
        id: PUSH_TYPE_INCOMING_CALL,
        launchActivity: 'default',
      },
      actions: [
        {
          title: translate('call.accept', 'Accept'),
          pressAction: { id: CALL_ACTION_ACCEPT, launchActivity: 'default' },
        },
        {
          // No launchActivity: declining must not boot the WebView.
          title: translate('call.decline', 'Decline'),
          pressAction: { id: CALL_ACTION_DECLINE },
        },
      ],
    },
  });
}

export async function cancelIncomingCallNotification(
  roomUuid: string,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.cancelNotification(roomUuid).catch(() => {});
}

/**
 * Rejects the call straight from native. Runs in the Android headless context
 * too, where nothing has hydrated the auth store yet and the WebView the token
 * refresh depends on does not exist — so this loads the stored tokens itself
 * and treats a failure as non-fatal.
 */
export async function declineIncomingCall(
  call: IncomingCall,
): Promise<boolean> {
  useIncomingCallStore.getState().clearIncomingCall(call.roomUuid);
  await cancelIncomingCallNotification(call.roomUuid);

  try {
    if (!useAuthStore.getState().accessToken) {
      await loadStoredTokensIntoStore();
    }
    await apiFetch('/api/call_rejected', {
      method: 'POST',
      body: { partner_id: call.partnerId, session_id: call.roomUuid },
    });
    return true;
  } catch (error) {
    // A stale access token cannot be refreshed headlessly — the refresh needs
    // the WebView for the integrity check. When the WebView is up the caller
    // retries through it; when it isn't, the caller rings out.
    // ponytail: no persisted retry queue until that actually bites.
    console.warn('[call-push] failed to reject call from native', error);
    return false;
  }
}

/** Answering only stops the ring here; the overlay hands over to the WebView. */
export async function answerIncomingCall(call: IncomingCall): Promise<void> {
  useIncomingCallStore.getState().answerIncomingCall(call);
  await cancelIncomingCallNotification(call.roomUuid);
}

/**
 * Returns true when the message was a call push and has been dealt with, so
 * the generic notification path can ignore it.
 */
export async function handleCallPushMessage(
  message: FirebaseMessagingTypes.RemoteMessage,
  { display = true }: { display?: boolean } = {},
): Promise<boolean> {
  const pushType = getCallPushType(message.data);
  if (!pushType) {
    return false;
  }

  const call = parseIncomingCall(message.data);
  if (!call) {
    console.warn('[call-push] call push without room_uuid/partner_id');
    return true;
  }

  if (pushType === 'cancelled') {
    useIncomingCallStore.getState().clearIncomingCall(call.roomUuid);
    await cancelIncomingCallNotification(call.roomUuid);
    return true;
  }

  useIncomingCallStore.getState().ringIncomingCall(call);
  if (display) {
    await displayIncomingCallNotification(call);
  }
  return true;
}

function callFromNotifeeEvent(event: NotifeeEvent): IncomingCall | null {
  const data = event.detail.notification?.data as PushData;
  return getCallPushType(data) === 'incoming' ? parseIncomingCall(data) : null;
}

async function handleNotifeeEvent(event: NotifeeEvent): Promise<void> {
  const call = callFromNotifeeEvent(event);
  if (!call) {
    return;
  }

  const { type, detail } = event;
  if (type === EventType.ACTION_PRESS) {
    if (detail.pressAction?.id === CALL_ACTION_DECLINE) {
      await declineIncomingCall(call);
      return;
    }
    if (detail.pressAction?.id === CALL_ACTION_ACCEPT) {
      await answerIncomingCall(call);
      return;
    }
  }

  if (type === EventType.PRESS) {
    // Tapping the body opens the app on the ring screen rather than answering
    // outright — the decision stays with the user.
    useIncomingCallStore.getState().ringIncomingCall(call);
    return;
  }

  if (type === EventType.DISMISSED) {
    useIncomingCallStore.getState().clearIncomingCall(call.roomUuid);
  }
}

/**
 * Cold start recovery. A full-screen intent launch never goes through the
 * press-action machinery, so the store can be empty while the notification is
 * still ringing in the shade.
 */
export async function restoreIncomingCallOnLaunch(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const initial = await notifee.getInitialNotification();
    const initialData = initial?.notification?.data as PushData;
    if (getCallPushType(initialData) === 'incoming') {
      const call = parseIncomingCall(initialData);
      if (call) {
        if (initial?.pressAction?.id === CALL_ACTION_ACCEPT) {
          await answerIncomingCall(call);
        } else {
          useIncomingCallStore.getState().ringIncomingCall(call);
        }
        return;
      }
    }

    const displayed = await notifee.getDisplayedNotifications();
    for (const entry of displayed) {
      const data = entry.notification?.data as PushData;
      if (getCallPushType(data) !== 'incoming') {
        continue;
      }
      const call = parseIncomingCall(data);
      if (!call) {
        continue;
      }
      if (isCallPushExpired(data)) {
        await cancelIncomingCallNotification(call.roomUuid);
        continue;
      }
      useIncomingCallStore.getState().ringIncomingCall(call);
      return;
    }
  } catch (error) {
    console.warn('[call-push] could not restore incoming call', error);
  }
}

/**
 * iOS rings from the APNs alert push, so the only thing we own is the pair of
 * actions on it. The push must carry `category: "INCOMING_CALL"` for these to
 * appear.
 */
export async function setUpIncomingCallCategory(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  await Notifications.setNotificationCategoryAsync(INCOMING_CALL_CATEGORY_ID, [
    {
      identifier: CALL_ACTION_ACCEPT,
      buttonTitle: translate('call.accept', 'Accept'),
      options: { opensAppToForeground: true },
    },
    {
      identifier: CALL_ACTION_DECLINE,
      buttonTitle: translate('call.decline', 'Decline'),
      // Declining stays out of the app entirely.
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}

/**
 * Shared by the iOS notification-response listener and its cold-start
 * equivalent. Returns true when the response was a call notification.
 */
export async function handleCallNotificationResponse(
  actionIdentifier: string,
  data: PushData,
): Promise<boolean> {
  if (getCallPushType(data) !== 'incoming') {
    return false;
  }

  const call = parseIncomingCall(data);
  if (!call || isCallPushExpired(data)) {
    return true;
  }

  if (actionIdentifier === CALL_ACTION_DECLINE) {
    await declineIncomingCall(call);
    return true;
  }
  if (actionIdentifier === CALL_ACTION_ACCEPT) {
    await answerIncomingCall(call);
    return true;
  }

  // Tapped the notification body: show the ring screen, don't answer for them.
  useIncomingCallStore.getState().ringIncomingCall(call);
  return true;
}

export function registerCallPushForegroundHandlers(): () => void {
  if (Platform.OS !== 'android') {
    return () => {};
  }
  return notifee.onForegroundEvent(event => {
    handleNotifeeEvent(event).catch(error =>
      console.warn('[call-push] foreground event failed', error),
    );
  });
}

// ── Module scope: must be installed before the app finishes booting, so that a
// push arriving while the app is backgrounded or terminated still runs code.
if (Platform.OS === 'android') {
  setBackgroundMessageHandler(getMessaging(), async message => {
    await handleCallPushMessage(message);
  });

  notifee.onBackgroundEvent(handleNotifeeEvent);
}
