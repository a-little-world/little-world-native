# Plan B — Native call migration: LiveKit RN + system call UI

> Larger option. Native media, CallKit/Telecom incoming calls. See
> [`01-incoming-call-notification.md`](./01-incoming-call-notification.md) for the smaller
> notification-only option, and [`03-comparison.md`](./03-comparison.md) for the side-by-side
> and the recommendation.

## Context

Calls today run entirely inside the Expo DOM component (`LittleWorldWebLazy` → one WebView
hosting the whole `frontend/` app). LiveKit's web SDK plays remote audio through an `<audio>`
element, so Android emits it on the MUSIC stream while mic capture puts the phone in
communication mode — hardware volume buttons then target the VOICE_CALL stream and appear to do
nothing. A `volumeControlStream` config plugin patches that symptom today.

The real limit is structural: a WebView cannot own the audio session. CallKit/Telecom hand the
app an audio session at answer time, and WKWebView/Chromium will not accept it. Native incoming
call screens therefore require native media first — it is a prerequisite, not a follow-up.

Goal: LiveKit runs natively, the OS draws incoming/outgoing call UI, calls survive cold start
from a locked screen, and audio routes over the voice-call stream with proper earpiece/speaker/BT
handling.

## Architecture decision

**Native owns media and call lifecycle. The existing WebView keeps the in-call side panels.**

`frontend/src/components/blocks/{ChatCore,TranslationTool,QuestionCards}` — ~1.4k lines — touch
no LiveKit APIs at all (verified: LiveKit imports appear only in `Calls/*`, `views/VideoCall*`,
`api/livekit.ts`, `helpers/video.ts`, `stores/connectedCall.ts`, `Layout/AppLayout.tsx`). They
read the app's own chat store and API. So they do not need to be ported.

Layout during a native call is a vertical split, not an overlay: native LiveKit video + controls
on top, the existing WebView below rendering a chrome-less panels route. No transparency, no
z-order tricks, no touch pass-through problems. Only the video surface, control bar, and call
lifecycle screens get written in RN — roughly `VideoCall.tsx` + `ControlBar.tsx` worth of UI,
rebuilt on `@a-little-world/little-world-design-system-native` (has Button/Text/Icon/Popover/
TextInput primitives).

Screen share is out of scope (needs ReplayKit broadcast extension + MediaProjection).

## Libraries

| Package | Version | Role |
| --- | --- | --- |
| `@livekit/react-native` | 2.12.0 | room, hooks, `VideoView`, `AudioSession` |
| `@livekit/react-native-webrtc` | 144.1.2 | media engine (fork; cannot coexist with `react-native-webrtc`) |
| `@livekit/react-native-expo-plugin` | 1.0.2 | prebuild wiring |
| `expo-callkit-telecom` | 0.4.0 | CallKit + Jetpack Core-Telecom, VoIP push parsing, audio session |

`expo-callkit-telecom` is tested against Expo SDK 55 / RN 0.83 (our exact versions), puts WebRTC
into manual-audio mode and drives it in lockstep with CallKit, and parses VoIP pushes natively so
cold start works without JS. It replaces `react-native-callkeep` (ConnectionService-era, last
published Nov 2024). It is v0.4.0 with a single maintainer — pin the exact version and treat the
Stage 3 spike as the go/no-go on it.

## Stage 1 — native LiveKit call

1. Add the three LiveKit packages (both lockfiles — root and standalone frontend, per the
   dual-lockfile workflow), register `@livekit/react-native-expo-plugin` in `app.config.ts`.
2. `registerGlobals()` in `app/_layout.tsx` before anything else mounts.
3. `src/store/callStore.ts` (zustand, already a dep) — mirror the fields of
   `frontend/src/features/stores/connectedCall.ts` so both sides speak the same shape.
4. `src/api/livekit.ts` (native) — POST `/api/livekit/authenticate` via the existing
   `src/api/helpers.ts` `apiFetch`; native already holds auth tokens, so it can join without the
   WebView being ready.
5. `app/call.tsx` (expo-router) — `LiveKitRoom` + `VideoView` tiles, connection states,
   permission prompts, prejoin.
6. `src/components/blocks/Call/ControlBar.tsx` — mic, camera, camera flip, speaker/earpiece,
   hang up, panel toggles. Native design system components.
7. Gate the frontend's own call path off when running native: new bridge action so
   `AppLayout.tsx` stops opening `ModalTypes.INCOMING_CALL` and `VideoCall.tsx` never mounts.
   **Critical** — two WebRTC stacks must never hold the mic at once.

## Stage 2 — panels stay in the WebView

1. Frontend: a chrome-less route (e.g. `/native-call-panels`) rendering `CallSidebar` content —
   Chat, TranslationTool, QuestionCards — driven by `chatId`/`partnerId` params.
2. Bridge additions in `src/components/blocks/DomCommunicationCore.tsx` (extend the existing
   `sendToDom` / `sendToReactNative` switch, no new transport):
   - native → dom: `CALL_UI_MODE` `{ mode: 'panels' | 'none', chatId, partnerId, callUuid }`
   - dom → native: `CALL_PANEL_ACTION` `{ action: 'hangup' | 'toggleMic' | ... }`
   - dom → native: `CALL_ROOM_EVENT` — forward websocket call events (`callRejected`,
     partner disconnect, `/api/call_rooms` updates) so native does not need a second WS.
3. `src/components/blocks/DomWebViewHost.tsx` — render inside a height-constrained container when
   `CALL_UI_MODE` is `panels`, native video above.
4. Cold start from push: native joins immediately via its own token fetch; panels appear once
   `WEBVIEW_READY` arrives. Audio must never wait on the WebView.

## Stage 3 — system call UI

1. Add `expo-callkit-telecom` + config plugin (ringtone/dialtone assets, `incomingCallTimeout`,
   mic permission string).
2. Wire events to the call store: `addCallAnsweredListener` → join room;
   `addCallEndedListener` → leave; mute/hold/route events → LiveKit local participant, and back.
   Report `reportOutgoingCallConnected` / `fulfillIncomingCallConnected` on LiveKit connect.
3. **Delete `plugins/with-media-volume-buttons.js` and its `app.config.ts` entry** — once Telecom
   owns the call, forcing `volumeControlStream = STREAM_MUSIC` breaks in-call volume control.
4. Android manifest via config plugin: `USE_FULL_SCREEN_INTENT`, foreground service types
   `phoneCall`/`microphone`/`camera`. No Play Console declaration exists for this — it's a
   per-app, on-device grant the user makes in Settings → Apps → Special app access, not a
   store review.
5. **FCM service conflict — resolve here.** `expo-callkit-telecom`'s Android service builds on
   `expo-notifications` and forwards non-`incomingCall` data messages to it, but this app
   registers `@react-native-firebase/messaging`. RNFB messaging is used only for `getToken` +
   permissions (`src/utils/firebase-util.tsx`; the `onMessage` handler in
   `src/components/blocks/Firebase.tsx` is commented out), so migrate token retrieval to
   `expo-notifications` `getDevicePushTokenAsync()` and drop `@react-native-firebase/messaging`.
   Keep `@react-native-firebase/app`.
6. iOS: register the PushKit token and send it to the backend as a distinct platform value.
   Existing APNs `.p8` works for VoIP; the topic is `<bundleId>.voip`.

## Stage 4 — backend push contract

Extend `/api/push_notifications/register` (already takes `platform`) with `ios_voip`, stored
alongside the FCM token — one device has both.

Send on call initiate, and a matching cancel on reject/timeout/answer-elsewhere:

- **iOS** — APNs `apns-push-type: voip` to the `.voip` topic:
  `{ "incomingCall": { eventId, serverCallId, hasVideo, startedAt, caller: { id, displayName, avatarUrl }, metadata: { chatId } } }`
- **Android** — high-priority **data-only** FCM (`priority: high`; notification-type messages will
  not wake app code in Doze):
  `{ "data": { "messageType": "incomingCall", "incomingCall": "<JSON string of the same event>" } }`

`eventId` is a UUID for dedup; `serverCallId` is the backend call/room id; `metadata` passes
through verbatim to JS. Cancel path: push a call-ended message so the ring stops and the module
can `reportCallEnded` — otherwise the callee rings until timeout.

## Stage 5 — rollout

- Backend-driven flag selecting native vs WebView call path; the WebView path stays functional
  (it is the browser path regardless) and is the fallback.
- Ship to internal/TestFlight first. The web call UI is not deleted in this migration.

## Risks

- `@livekit/react-native-webrtc` 144.x publishes no New Architecture statement; RN 0.83 defaults
  to new arch. Verify on a dev build in Stage 1 before anything else is built on it.
- `@livekit/react-native` depends on `@livekit/components-react ^2.9.17`, while `frontend/`
  installs a patched local tarball at 2.9.21 (`frontend/prebuild/`). Check resolution — the
  patched copy must keep winning inside the DOM bundle.
- `expo-callkit-telecom` at v0.4.0, one maintainer. Pin exactly; be prepared to fork.
- Android 14+ gates `USE_FULL_SCREEN_INTENT` behind a per-app, on-device grant (not a Play
  Console declaration — there is no store review to wait on). The app must prompt for it
  itself, once, since the grant state isn't readable from JS.

## Verification

Real devices, both platforms, at each stage — the simulator cannot validate any of this.

1. **The original bug**: media volume at 0, native N ↔ web W call → N hears W. Volume buttons
   move the in-call volume, and the on-screen indicator says "call", not "media".
2. **Cold start**: app force-quit, device locked → push → full-screen ring → answer → audio
   within ~2s, before the WebView finishes loading.
3. **Routing**: earpiece ↔ speaker ↔ Bluetooth headset mid-call; answer/hang up from the headset
   button; unplug mid-call.
4. **Interruption**: real cellular call arrives during an app call — Telecom/CallKit holds or
   ends it cleanly, and the app recovers.
5. **Cancel**: caller hangs up while callee is ringing → ring stops on the callee within ~1s.
6. **Panels**: chat, translation tool and question cards work in the WebView half; keyboard
   opens without breaking the split; text sent from the translation tool lands in chat input.
7. **Mic exclusivity**: confirm the WebView never calls `getUserMedia` while a native call runs
   (echo/robotic audio is the symptom).
8. `npx expo-doctor` clean after each dependency stage.
