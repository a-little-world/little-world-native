# Comparison — which call plan to build

> Reading order: this file first. Details in
> [`01-incoming-call-notification.md`](./01-incoming-call-notification.md) (Plan A) and
> [`02-native-call-migration.md`](./02-native-call-migration.md) (Plan B).

## Recommendation

**Build Plan A.** The stated requirement is that the call looks like the current web call UI and
that the incoming-call screen can stay simple. Plan A is exactly that shape: it adds ringing and
keeps the call itself where it is. Plan B rewrites the call UI in React Native — it spends its
entire budget on the part that is explicitly not supposed to change.

Plan B is not wrong, it is just a different project: it exists to own the *audio session*, and
everything else it drags in is the cost of that. Build it when the audio session becomes the
problem, not before. Trigger conditions are at the bottom of this file.

## How each one actually works

### Today

One WebView (`LittleWorldWebLazy` → `DomWebViewHost`) hosts the whole `frontend/` app. LiveKit's
web SDK runs inside it and plays remote audio through an `<audio>` element. Incoming calls are
discovered by the frontend polling `/api/call_rooms` over the websocket bridge, which opens the
`INCOMING_CALL` modal in `AppLayout.tsx`. Nothing outside the WebView knows a call exists — so a
backgrounded or terminated app shows the callee nothing at all.

`plugins/with-media-volume-buttons.js` pins `volumeControlStream = STREAM_MUSIC` so the hardware
volume buttons control the stream the WebView is actually playing on. That is a real fix, and it
is the entire fix for the original "N cannot hear W" bug.

### Plan A — ring natively, call in the WebView

```
backend                 native (RN)                        WebView (frontend/)
   │
   │ data-only FCM / time-sensitive APNs
   ├──────────────────► callPush.ts  (module scope,
   │                     runs before React mounts)
   │                          │
   │                          ├─ notify-kit notification
   │                          │   full-screen intent (Android)
   │                          │   Accept / Decline actions
   │                          │
   │             Decline ─────┤ apiFetch('/api/call_rejected')   ← WebView never boots
   │                          │
   │             Accept ──────┤ incomingCallStore
   │                          ├─ app/incoming-call.tsx  ("connecting…")
   │                          │
   │                          ├─ ANSWER_INCOMING_CALL ──────────► initCallSetup({ userId })
   │                          │   (queued until WEBVIEW_READY)     ↑ same call the web
   │                          │                                      INCOMING_CALL modal makes
   │                          ◄── CALL_VIEW_READY ────────────────┤
   │                            dismiss native screen
```

Key properties:

- Media never leaves the WebView. No second WebRTC stack, no mic arbitration, no audio-session
  question at all.
- The native screen exists only to cover the cold-start gap while the WebView boots. It is
  throwaway UI by design — a name, an avatar, two buttons, a spinner.
- Accept lands in the *existing* call flow (`initCallSetup`), so the call looks identical to
  today's and every in-call feature — chat, translation tool, question cards — works unchanged
  because none of it is touched.
- Decline is fully native: one authenticated POST, no WebView load.
- The volume-buttons plugin stays correct, because nothing here claims the voice stream.

The structural ceiling: iOS will not give a non-CallKit app a full-screen lockscreen ring. iOS
callees get a time-sensitive banner that rings, with Accept/Decline actions. That is the honest
limit of this plan and no amount of extra work inside it moves that line.

### Plan B — native media, system call UI

```
backend                 native (RN)                        WebView (frontend/)
   │
   │ VoIP push (iOS) / data-only FCM (Android)
   ├──────────────────► expo-callkit-telecom  (parsed natively,
   │                     no JS needed for cold start)
   │                          │
   │                          ├─ CallKit / Telecom draws the OS call screen
   │                          │
   │             Answer ──────┤ AudioSession + LiveKit RN joins room
   │                          │   audio live in ~2s, WebView not involved
   │                          │
   │                          ├─ CALL_UI_MODE {mode:'panels'} ──► chrome-less panels route
   │                          │   native video on top,             (chat / translation /
   │                          │   WebView below in a split          question cards, unchanged)
   │                          ◄── CALL_PANEL_ACTION ──────────────┤
```

Key properties:

- Native owns the audio session, so the OS call screen, earpiece/proximity, Bluetooth answer
  button, and arbitration with real cellular calls all become possible. None of them are
  possible in Plan A — CallKit/Telecom hand the app an audio session that WKWebView/Chromium
  will not accept. This is a prerequisite relationship, not a nice-to-have.
- The video surface and control bar are rewritten in RN on the native design system. The in-call
  panels (~1.4k lines) are *not* rewritten — they touch no LiveKit APIs and stay in the WebView,
  rendered in a vertical split below the native video.
- The volume-buttons plugin must be **deleted** in Stage 3 — once Telecom owns the call, forcing
  `STREAM_MUSIC` breaks in-call volume.
- Two call UIs exist afterwards, permanently: the RN one for the app, the web one for browsers.
  Every future call feature is built twice or built in the panels half.

## Side by side

| | Plan A | Plan B |
| --- | --- | --- |
| Call UI matches today's web UI | yes, it *is* today's UI | no — rewritten in RN |
| Android lockscreen ring | yes (full-screen intent) | yes (Telecom) |
| iOS lockscreen ring | no — time-sensitive banner only | yes (CallKit) |
| Rings when app terminated | yes, both platforms | yes, both platforms |
| Decline without booting WebView | yes | yes |
| Time from Accept to audio | WebView boot (~seconds, covered by the native screen) | ~2s, WebView irrelevant |
| Audio on voice-call stream | no (media stream + volume plugin) | yes |
| Earpiece / proximity / BT answer button | no | yes |
| Survives an incoming cellular call | no | yes |
| Mic held by | WebView only | native only (WebView must be gated off) |
| In-call chat / translation / cards | untouched | untouched (moved to a panels route) |
| New runtime dependencies | 1 (`react-native-notify-kit`) | 4 (LiveKit RN ×3, `expo-callkit-telecom`) |
| Blocked on Play Console review | no | no |
| Blocked on Apple | no | no (VoIP push uses the existing `.p8`) |

## Size

Rough, focused-work estimates. Backend work is separate from the app work in both.

| | Plan A | Plan B |
| --- | --- | --- |
| New native files | ~3 (`callPush.ts`, `incomingCallStore.ts`, `app/incoming-call.tsx`) | ~10+ (`app/call.tsx`, `ControlBar.tsx`, call store, native livekit api, callkit wiring, …) |
| Changed files | ~6 | ~12 |
| New native code | ~600–900 lines | ~2,500–3,500 lines |
| Frontend changes | 2 handlers + modal suppression | new chrome-less panels route + gating the web call path off |
| Backend | push payload + cancel path on the existing registry | VoIP token type, VoIP push, cancel path |
| App work | **~1.5–2 weeks** | **~5–8 weeks** |
| Riskiest part | notify-kit bridgeless on RN 0.83 | `@livekit/react-native-webrtc` on new arch; `expo-callkit-telecom` at v0.4.0, one maintainer |
| Ongoing cost | one notification path | a second call UI, a second WebRTC stack, a pinned v0.x dependency |

Correction: `USE_FULL_SCREEN_INTENT` is not a Play Console declaration — it's a per-app,
on-device grant the user makes themselves (Settings → Apps → Special app access → Full
screen intent notifications), with no store-side review at all. Both plans still need an
in-app prompt for that grant (there's no way to check it was already given, so it can only
ask once), but neither is gated on external review latency for it.

## If you build A now, what does B throw away later?

Reusable: the device registry work, the cancel-path discipline, `incomingCallStore`, the bridge
sequencing (queue until `WEBVIEW_READY`), the decline-from-native path, and the frontend
accept/decline entry points.

Discarded: the notify-kit notification and its full-screen intent (Telecom draws its own UI),
`app/incoming-call.tsx` (CallKit/Telecom replace it), the `showWhenLocked` activity patch, and
the iOS notification-category path (VoIP push replaces it).

So roughly half of Plan A's native work survives into Plan B. Plan A is not a stepping stone —
it is a cheaper product with a lower ceiling. Doing A first costs about a week of rework if B
ever happens, which is small next to B's own 5–8 weeks and much smaller than the cost of
discovering after five weeks of B that the audio session was never the thing users complained
about.

## When Plan B becomes worth it

Any one of these, on real user reports rather than intuition:

1. iOS users say they miss calls because the banner is not enough. This is the strongest signal —
   it is the one gap Plan A structurally cannot close.
2. Calls break when a cellular call arrives, often enough to matter.
3. Bluetooth headset users cannot answer or control calls from the device.
4. Earpiece use (phone at the ear) is a real usage pattern and the speakerphone-only behaviour is
   a complaint.
5. WebView media stability itself becomes the bug source — echo, dropped audio, background
   suspension.

None of these are hypothetical-only; they are just unmeasured today. Plan A ships ringing, which
is the actual missing feature, and generates the data that answers whether B is needed.
