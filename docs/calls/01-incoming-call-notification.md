# Plan A — Incoming call notification + native ring screen, handing over to the WebView call

> Smaller option. No native media, no call-screen rewrite. See
> [`02-native-call-migration.md`](./02-native-call-migration.md) for the full migration, and
> [`03-comparison.md`](./03-comparison.md) for the side-by-side and the recommendation.

## Context

Calls run inside the Expo DOM component (`LittleWorldWebLazy` → one WebView hosting `frontend/`).
Incoming calls are only visible when the app is already open: `AppLayout.tsx` polls
`/api/call_rooms` over the websocket bridge and opens the `INCOMING_CALL` modal. If the app is
backgrounded or closed, the callee sees nothing.

Goal: a real incoming-call alert when the app is not in the foreground, a native screen with
Accept/Decline, and then handover into the existing web call — no native media, no call-screen
rewrite.

Deliberately **not** in scope: CallKit and Android Telecom. Both hand your app an audio session
at answer time that WKWebView/Chromium will not accept, so both would force native LiveKit. That
is the separate, much larger migration.

## What this buys, and what it does not

Works:

- Android: full-screen ringing UI over the lockscreen, Accept/Decline, cold start from terminated.
- iOS: a time-sensitive notification that rings and shows Accept/Decline actions, in every app
  state including terminated.
- Decline works without loading the WebView.

Does not (needs the native-media migration):

- iOS full-screen lockscreen ring — CallKit-only, and CallKit requires native media.
- Audio on the voice-call stream, earpiece/proximity, Bluetooth answer button.
- Arbitration with real cellular calls.
- Android: OEMs that hard-kill force-stopped apps (several Chinese vendors) will not deliver the
  data push at all.

The `plugins/with-media-volume-buttons.js` fix **stays** — nothing here claims the voice stream,
so pinning the volume buttons to the media stream remains correct.

## Library

`react-native-notify-kit` (10.5.0) — the Invertase-recommended maintained fork of Notifee
(`@notifee/react-native` 9.1.8 is bridge-era; RN 0.83 is bridgeless by default). Notifee/notify-kit
is the only RN library exposing Android full-screen intents. It ships a TurboModule codegen config
and an Expo config plugin (`app.plugin.js`), and works alongside the already-installed
`@react-native-firebase/messaging`, which stays as the FCM transport.

`expo-notifications` (already installed) covers the iOS notification categories and actions.

## Stage 1 — backend push contract

Reuse the existing device registry (`/api/push_notifications/register`, already stores
`install_id`/`token`/`platform`). No new token type is needed — no PushKit here.

Send on call creation, addressed to the callee's devices:

- **Android** — high-priority **data-only** FCM. A `notification` block would be rendered by the
  system and would never run app code in Doze; it must be data-only with `priority: high`.
  ```jsonc
  { "data": { "type": "incoming_call", "room_uuid": "...", "partner_id": "...",
              "partner_name": "Jane", "partner_image_url": "https://...",
              "expires_at": "2026-08-18T19:42:11Z" } }
  ```
- **iOS** — normal APNs alert push (not silent): `interruption-level: time-sensitive`,
  `category: "INCOMING_CALL"`, a ringtone-length custom sound, the same fields in the payload,
  and `apns-collapse-id: <room_uuid>`.

Cancel path (caller hung up / answered elsewhere / timeout) — required, or the callee rings on:

- Android: `{ "data": { "type": "incoming_call_cancelled", "room_uuid": "..." } }`
- iOS: an alert push with the **same** `apns-collapse-id`, body "Missed call" — it replaces the
  ringing notification in place. iOS cannot silently retract a delivered notification reliably.

The reject endpoint already exists: `POST /api/call_rejected { partner_id, session_id }`.

## Stage 2 — Android ring

1. Add `react-native-notify-kit` + its config plugin to `app.config.ts`. Add
   `USE_FULL_SCREEN_INTENT` to the `android.permissions` list (already contains
   `POST_NOTIFICATIONS` handling in `src/utils/firebase-util.tsx`).
2. `src/utils/callPush.ts` — register `setBackgroundMessageHandler` at **module scope**, imported
   from `app/_layout.tsx` top level so it is installed before any component renders. The existing
   commented-out `onMessage` handler in `src/components/blocks/Firebase.tsx` is the place to mirror
   for the foreground case.
3. On `type: 'incoming_call'`, display a notify-kit notification with `category: 'call'`,
   `importance: HIGH`, `ongoing: true`, `autoCancel: false`, a looping-length ringtone sound,
   `fullScreenAction` pointing at the app, and Accept/Decline actions.
4. Extend `plugins/with-media-volume-buttons.js` (rename to something neutral, e.g.
   `plugins/with-call-activity.js`) to also set `showWhenLocked` / `turnScreenOn` on
   `MainActivity` — the same `withMainActivity` mod, one more anchor.
5. Background action handler: **Decline** → `apiFetch('/api/call_rejected', ...)` directly from
   native (`src/api/helpers.ts` already holds the auth tokens) and cancel the notification —
   no WebView needed. **Accept** → write the call to the native store and open the app.
6. `type: 'incoming_call_cancelled'` → cancel the notification by `room_uuid`.
7. Play Console: the calling-app declaration is required for `USE_FULL_SCREEN_INTENT` on
   Android 14+. Start it early, review latency is external.

## Stage 3 — native ring screen + handover

1. `src/store/incomingCallStore.ts` (zustand, already a dep) — `{ roomUuid, partnerId,
   partnerName, partnerImageUrl, status }`.
2. `app/incoming-call.tsx` — caller avatar and name from the push payload, Accept/Decline, and a
   "connecting…" state after Accept. This screen exists to cover the cold-start gap: on Accept the
   WebView still has to boot, and without it the user stares at a splash screen.
3. New bridge actions in `src/components/blocks/DomCommunicationCore.tsx` (extend the existing
   `sendToDom`/`sendToReactNative` switch — no new transport):
   - native → dom `ANSWER_INCOMING_CALL` `{ partnerId, roomUuid }`
   - dom → native `CALL_VIEW_READY` `{ roomUuid }` → dismiss the native screen
4. Sequencing: if the WebView is already ready, send immediately; otherwise queue and flush on the
   existing `WEBVIEW_READY` case.
5. Frontend receive handler: `ANSWER_INCOMING_CALL` calls the same thing `onAnswerCall` in
   `frontend/src/components/blocks/Layout/AppLayout.tsx:193` calls — `initCallSetup({ userId })`.
   Decline mirrors `onRejectCall` (`disconnectFromCall` + `blockIncomingCall`) so a decline made
   natively does not re-open the modal once the WebView loads.
6. **UX decision to confirm during build:** `initCallSetup` opens the CALL_SETUP prejoin modal, so
   accepting from a lockscreen currently lands in device selection rather than the call. Recommend
   passing a flag to skip prejoin when the answer came from a notification.
7. Suppress the web `INCOMING_CALL` modal while the native screen is up, so the same call is not
   offered twice.

## Stage 4 — iOS

1. Notification category `INCOMING_CALL` with Accept/Decline actions via `expo-notifications`
   `setNotificationCategoryAsync`, registered at startup.
2. Add the `com.apple.developer.usernotifications.time-sensitive` entitlement in `app.config.ts`
   `ios.entitlements` (no special Apple approval needed).
3. Ship the ringtone as a bundled sound (config plugin asset), max 30s.
4. Response handler → same `incomingCallStore` → same handover path as Android. Decline from the
   notification action hits `/api/call_rejected` without opening the app.

## Files touched

- `app.config.ts` — notify-kit plugin, `USE_FULL_SCREEN_INTENT`, iOS entitlement, sound assets
- `plugins/with-call-activity.js` — renamed, adds `showWhenLocked`/`turnScreenOn`
- `src/utils/callPush.ts` — new; FCM handlers, notification display, decline-without-WebView
- `src/store/incomingCallStore.ts` — new
- `app/incoming-call.tsx` — new
- `app/_layout.tsx` — import the push module at top level
- `src/components/blocks/DomCommunicationCore.tsx` — two new bridge actions
- `src/components/blocks/Firebase.tsx` — foreground message case
- `frontend/src/…` receive handler + `AppLayout.tsx` — accept/decline entry points, modal suppression

## Verification

Real devices, both platforms — none of this is testable in a simulator.

1. App terminated, screen locked, Android → push → full-screen ring over the lockscreen → Accept →
   in the call. Measure the gap between Accept and the call view; that is what Stage 3's screen is
   covering.
2. Same on iOS → time-sensitive banner rings, Accept action → app opens into the call.
3. Decline with the app terminated → caller sees the rejection, callee's app never boots the
   WebView.
4. Caller cancels while callee rings → callee's ring stops (Android) / is replaced by "Missed
   call" (iOS).
5. App already in the foreground → exactly one prompt, not the native screen and the web modal.
6. Regression: the media-volume fix still holds — media volume at 0, native ↔ web call, volume
   buttons raise the audible stream.
7. Android battery optimisation: swipe the app away from recents, then push. Note which OEM
   devices fail — that is a documented limitation, not a bug to chase.
8. `npx expo-doctor` clean after the dependency stage; verify notify-kit works bridgeless on
   RN 0.83 before building anything on top of it.
