import { Platform } from 'react-native';

import * as IntentLauncher from 'expo-intent-launcher';
import i18next from 'i18next';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
} from 'react-native-notify-kit';

import { environment } from '@/environment';
import environmentNative from '@/environments/env';
import { getAccessJwtToken } from '@/src/api/helpers';
import { useAuthStore } from '@/src/store/authStore';
import { getEffectiveBackendUrl } from '@/src/store/debugStore';
import { IncomingCall, incomingCallStore } from '@/src/store/incomingCallStore';

/**
 * Deliberately a NEW channel id: Android notification channels are immutable
 * after creation and an `incoming_calls` channel already shipped in earlier
 * builds of this branch, so its sound/DND settings can never be changed on
 * those devices.
 */
export const INCOMING_CALL_CHANNEL_ID = 'incoming_calls_v2';

const RING_TIMEOUT_MS = 45000;

/** FCM data values are always strings; anything else is not our payload. */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseCallPush(
  data: Record<string, unknown> | undefined,
): { type: 'incoming_call' | 'call_cancelled'; call: IncomingCall } | null {
  if (!data) {
    return null;
  }

  const type = asString(data.type);
  if (type !== 'incoming_call' && type !== 'call_cancelled') {
    return null;
  }

  const sessionId = asString(data.session_id);
  const partnerId = asString(data.partner_id);
  if (!sessionId || !partnerId) {
    return null;
  }

  const callerImageUrl = asString(data.caller_image_url);

  return {
    type,
    call: {
      sessionId,
      partnerId,
      // No dedicated fallback key exists, and the subtitle reads fine as a
      // title when the backend omits the caller name.
      callerName:
        asString(data.caller_name) || i18next.t('incoming_call.subtitle'),
      callerImageUrl: callerImageUrl || undefined,
      path: asString(data.path) || `/app?call-setup=${partnerId}`,
    },
  };
}

export async function createIncomingCallChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: INCOMING_CALL_CHANNEL_ID,
    name: i18next.t('notification_channel.incoming_calls_v2'),
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true,
    vibration: true,
    // Every entry must be > 0: notifee rejects the conventional leading 0
    // (`ms <= 0` fails validateAndroidChannel). Pairs are wait/vibrate.
    vibrationPattern: [300, 1000, 800, 1000],
    // notifee's channel default is NO sound at all - the literal string
    // 'default' is required to get the system notification sound.
    // ponytail: the repo ships no audio assets, so we use the system sound.
    // Dropping in a custom ringtone raw resource later means bumping the
    // channel id again (channels are immutable once created).
    sound: 'default',
  });
}

/**
 * Whether Android will honour our full-screen intent.
 *
 * Android 14+ treats USE_FULL_SCREEN_INTENT as special app access ("Full screen
 * notifications") and grants it only to calling/alarm apps - the Play Store
 * revokes it for everything else, and the user can revoke it by hand. When it is
 * denied Android silently downgrades the notification to a heads-up banner,
 * which on a locked screen is just an ordinary notification: no call screen.
 */
export async function canUseFullScreenIntent(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const settings = await notifee.getNotificationSettings();
  // NOT_SUPPORTED means the OS predates the permission model, where full-screen
  // intents are always allowed - only an explicit DISABLED is a problem.
  return (
    settings.android.fullScreenIntent !== AndroidNotificationSetting.DISABLED
  );
}

/** Opens the system "Full screen notifications" page for this app. */
export async function openFullScreenIntentSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await IntentLauncher.startActivityAsync(
    'android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT',
    { data: `package:${environmentNative.bundleId}` },
  );
}

export async function displayIncomingCall(call: IncomingCall): Promise<void> {
  // On iOS the OS renders the (time-sensitive) alert push itself.
  if (Platform.OS !== 'android') {
    return;
  }

  if (!(await canUseFullScreenIntent())) {
    // Display anyway: it degrades to a heads-up notification, which is the
    // correct fallback. Use openFullScreenIntentSettings() to let the user fix it.
    console.warn(
      '[incoming-call] full-screen intent DISABLED - the call screen will not appear on the lock screen',
    );
  }

  await notifee.displayNotification({
    // The cancel push targets this id.
    id: call.sessionId,
    title: call.callerName,
    body: i18next.t('incoming_call.subtitle'),
    // Carried so a cold launch can recover the ringing call: notifee only puts
    // the notification into the full-screen launch intent when
    // `fullScreenAction.mainComponent` is set, which we do not use - so there
    // is no press event and no initial notification on that path.
    // Values must be strings (the data bundle is string-keyed, like FCM).
    data: {
      type: 'incoming_call',
      session_id: call.sessionId,
      partner_id: call.partnerId,
      caller_name: call.callerName,
      caller_image_url: call.callerImageUrl ?? '',
      path: call.path,
    },
    android: {
      channelId: INCOMING_CALL_CHANNEL_ID,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      // Launches MainActivity over the lock screen. `launchActivity` is set
      // explicitly: notifee resolves it and silently drops the full-screen
      // intent when it cannot find an activity.
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      ongoing: true,
      autoCancel: false,
      // Also set per-notification, not just on the channel: the caller's name
      // must be readable on the lock screen, not collapsed to "new notification".
      visibility: AndroidVisibility.PUBLIC,
      timeoutAfter: RING_TIMEOUT_MS,
      loopSound: true,
      ...(call.callerImageUrl ? { largeIcon: call.callerImageUrl } : {}),
      // Generated by the expo-notifications config plugin.
      smallIcon: 'notification_icon',
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        {
          title: i18next.t('incoming_call.decline'),
          pressAction: { id: 'decline' },
        },
        {
          title: i18next.t('incoming_call.accept'),
          pressAction: { id: 'accept', launchActivity: 'default' },
        },
      ],
    },
  });
}

/**
 * Recovers the call that is currently ringing from the displayed notification.
 *
 * The ringing notification is `ongoing` with a `timeoutAfter`, so it *is* the
 * source of truth while the call is live: it disappears on its own when the
 * call times out, is cancelled by the cancel push, or is accepted/declined.
 * Reading it back therefore needs no persistence and no stale-state handling.
 */
export async function getDisplayedIncomingCall(): Promise<IncomingCall | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const displayed = await notifee.getDisplayedNotifications();
    const match = displayed.find(
      entry =>
        entry.notification.android?.channelId === INCOMING_CALL_CHANNEL_ID,
    );
    if (!match) {
      return null;
    }

    const parsed = parseCallPush(match.notification.data);
    return parsed?.type === 'incoming_call' ? parsed.call : null;
  } catch (error) {
    console.warn(
      '[incoming-call] failed to read displayed notifications',
      error,
    );
    return null;
  }
}

export async function cancelIncomingCall(sessionId: string): Promise<void> {
  try {
    await notifee.cancelNotification(sessionId);
  } catch (error) {
    console.warn('[incoming-call] failed to cancel notification', error);
  }

  if (incomingCallStore.get().call?.sessionId === sessionId) {
    incomingCallStore.get().clear();
  }
}

export async function declineCall(call: IncomingCall): Promise<void> {
  // NOTE: deliberately not using `apiFetch` / `refreshAccessTokens` here.
  // `refreshAccessTokens` wipes the stored tokens when
  // `domCommunicationStore.sendToDom` is absent, which is exactly the case in
  // a headless background handler - using it would log the user out.
  try {
    // The zustand store is not hydrated in a headless handler, so fall back to
    // SecureStore.
    const token =
      useAuthStore.getState().accessToken ?? (await getAccessJwtToken());

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-UseTagsOnly': 'true',
      'X-CSRF-Bypass-Token': 'abc',
    };
    if (environment.allowNgrokRequests) {
      headers['ngrok-skip-browser-warning'] = '69420';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    await fetch(`${getEffectiveBackendUrl()}/api/call_rejected`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        partner_id: call.partnerId,
        session_id: call.sessionId,
      }),
    });
  } catch (error) {
    // Best effort: if the token is stale the decline is dropped and the
    // caller's ring timeout is the backstop.
    console.warn('[incoming-call] decline failed', error);
  }
}
