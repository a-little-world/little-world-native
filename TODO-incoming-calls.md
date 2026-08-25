# Incoming calls — open items

Feature: push-driven incoming calls. Full-screen ring over the lock screen on Android, time-sensitive notification with Accept/Decline on iOS. Accept hands off to the existing webapp call flow in the DOM WebView; Decline is a single `POST /api/call_rejected`.

Branch `native-calls-new` in all three repos (native, `frontend/` submodule, `little-world-backend`).

---

## Do next

- [ ] **Cloud rebuild.** `expo-intent-launcher` was added, so a JS reload is not enough.
- [x] **Grant the full-screen intent permission.** Confirmed on a Pixel 10 / GrapheneOS: a fresh install does **not** auto-grant it, the in-app prompt fires on first launch and the settings deep-link works. Existing users get the same prompt on their first launch after updating, because the `incoming_call_fsi_prompt_dismissed` key is new and unset for everyone. Dismissing it re-arms once a call has actually rung without the permission (`incoming_call_fsi_ring_degraded`). Debug Panel -> _Incoming calls_ shows the state and re-opens the setting at any time. To re-test the prompt, clear both SecureStore keys or reinstall.
- [ ] **Watch for Play revoking it.** Android 14+ makes `USE_FULL_SCREEN_INTENT` special app access; the Play Store revokes it for apps it does not classify as calling/alarm apps. There is currently no full-screen-intent declaration form in Play Console (checked), so nothing to file - but re-check the grant state on a Play-distributed build, since side-loaded and Play installs can differ. Nothing in this repo influences the grant beyond declaring the permission, which it does (plus `MANAGE_OWN_CALLS` as the conventional calling-app marker).

### Diagnosing a denied grant

```sh
PKG=com.littleworld.littleworldapp.dev          # .beta / no suffix for staging / prod
adb shell dumpsys package $PKG | grep -i full_screen   # is it even declared?
adb shell appops get $PKG USE_FULL_SCREEN_INTENT       # current grant state
adb shell appops set $PKG USE_FULL_SCREEN_INTENT allow # force-grant for testing
```

Not listed under Settings -> Apps -> Special app access -> Full screen notifications means the permission is missing from that APK's manifest, i.e. the build predates the `app.config.ts` change. A manifest permission cannot be shipped over the air - EAS Update / Metro only replace the JS bundle - so that case needs a native rebuild.

- [ ] **Metro bundle check** never ran (`expo export --platform android`) — the entry point rewrite (`index.js`) has not been validated by a real bundle.

### On-device test matrix

Nothing here has been verified on a phone except where noted.

- [ ] Android locked → full-screen call UI over the keyguard, caller name + avatar, ringtone
- [x] Android unlocked, another app in front → heads-up call banner
- [ ] Android force-stopped → no push delivered. Expected OS behaviour, don't chase it
- [ ] iOS locked → banner + ringtone, breaks through Focus, long-press reveals Accept/Decline
- [ ] Accept (every state) → app foregrounds, call-setup modal for the right partner, LiveKit PreJoin appears
- [ ] Decline → notification clears, `POST /api/call_rejected` lands with the right `partner_id` / `session_id`
- [ ] Cancel push → a ringing notification disappears within a second
- [ ] App already open and foregrounded → only the existing WebSocket modal, no duplicate native overlay
- [ ] Full-screen intent revoked in Settings → degrades to heads-up, no crash

---

## Known gaps in the feature

- [ ] **No server-side ring timeout.** Android self-dismisses after 45s via the client's `timeoutAfter` plus the FCM `ttl`; iOS leaves a silent entry in the tray forever. Real fix: a celery `apply_async(countdown=…)` keyed on `LivekitSession`, checking `is_active and not both_have_been_active`.
- [ ] **A missed call leaves no trace.** The ring times out and nothing indicates it happened. The backend already writes a `<MissedCallWidget>` chat message on `participant_left` — surfacing that as an ordinary chat push would close the gap.
- [ ] **Accept on the Android notification costs one extra tap.** It lands on the in-app overlay rather than going straight into the call. Distinguishing "pressed Accept" from "full-screen intent launched the app" needs a marker persisted across the JS context switch. Marked with a `ponytail:` comment in `src/utils/registerBackgroundHandlers.ts`. Decline is unaffected — it works fully headless.
- [ ] **No custom ringtone.** The repo ships no audio assets, so the channel uses `sound: 'default'` + `loopSound`. Adding a real ringtone means bumping the channel id again (`incoming_calls_v3`) — Android notification channels are immutable once created.
- [ ] **iOS notifications have no caller avatar.** Needs a Notification Service Extension; notify-kit's config plugin can generate one (`ios.notificationServiceExtension`).
- [ ] **iOS has no full-screen lock-screen call UI.** Accepted trade-off, not a bug: Apple DTS states CallKit and WKWebView are architecturally incompatible (CallKit takes exclusive mic access in the app process, the WebView renderer is a separate process with its own audio session) and recommends exactly this alert-push approach for webview-based calling apps. Revisit only if the call screen itself goes native.

---

## Pre-existing problems found along the way

Not caused by this work, but each one cost time or hides signal.

- [ ] **`tsconfig.json` cannot typecheck.** `TS5098: Option 'customConditions' can only be used when 'moduleResolution' is set to 'node16', 'nodenext', or 'bundler'` — `expo/tsconfig.base` sets `customConditions` while the repo pins `moduleResolution: "node"`. `tsc` fails before checking anything, so **CI has zero type signal**. Everything in this feature was checked via a scratch config overriding `moduleResolution: "bundler"` (653 pre-existing errors, unchanged by this work).
- [ ] **No ESLint config in the native repo.** `pnpm run lint` tries to bootstrap one and dies on pnpm's workspace-root guard (`ERR_PNPM_ADDING_TO_ROOT`). The feature was never linted.
- [ ] **Backend venv cannot run Django.** protobuf's C extension is incompatible with its Python 3.14 (`TypeError: Metaclasses with custom tp_new are not supported`), and the pure-Python fallback env var doesn't help because the probe import itself crashes. Use `docker compose exec backend python manage.py test …`.
- [ ] **The LiveKit webhook is unauthenticated.** `settings.LIVEKIT_WEBHOOK_SECRET` exists but is never read, and `LiveKitRoom.objects.get` / `User.objects.get` are unguarded so a malformed event 500s. It now also triggers push notifications, which raises the stakes.
- [ ] **`frontend/src/environment.ts` is dirty** with local dev config (`backendUrl: 'http://localhost:8000'`, `isNative: true`). Don't commit it.
- [ ] **Outdated deps.** `pnpm exec expo install --check` flags `expo-web-browser`, `react`, `react-native`, `react-native-worklets`, `@types/react`, `react-dom`.
- [ ] **Locale drift.** `notification_channel.random_calls` is orphaned (no matching channel). `en.json` / `de.json` have pre-existing key asymmetries: en-only `settings.personal_profilePicture`, `vc_translator_type_here`; de-only `cp_cancel_search_confirm`, `cp_cancel_search_reject`.
- [ ] **`AppLayout.tsx` cold-start param churn.** On a cold start with `?call-setup=X`, the read effect inits call setup while the write effect in the same pass still sees `callSetup === null` and deletes the param; the re-render re-sets it. Converges correctly, but costs two extra history entries. Fix is `setSearchParams(fn, { replace: true })` on the delete branch.

---

## Reference

Backend push contract, hook points and rationale are documented in the plan file: `~/.claude/plans/i-want-to-implement-goofy-wilkinson.md`.

Key invariants worth not breaking:

- **Android must be data-only.** A `notification` block makes the system tray render it and `setBackgroundMessageHandler` never runs — no full-screen intent.
- **iOS must be an alert push.** A data-only push on iOS is a silent push: throttled, and unable to ring.
- **`session_id` is the `LiveKitRoom` uuid**, not the `LivekitSession` uuid — that is what the app posts back to `/api/call_rejected`.
- **Do not route call pushes through `User.push_devices()`.** It narrows to `online()` devices whenever any exist; a backgrounded app has closed its websocket, so an open browser tab would cause the phone to be skipped. Regression test: `test_a_ring_reaches_the_phone_even_when_a_browser_session_is_open`.
- **The cancel push is only sent for unanswered calls.** It is an alert push on iOS, so firing it after a completed call would surface a bogus "Missed call" banner with no ring to collapse onto.
