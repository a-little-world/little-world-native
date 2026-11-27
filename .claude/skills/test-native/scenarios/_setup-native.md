# Native setup (Android emulator)

- Emulator: `adb devices`; none → `emulator -avd pixel &`, `adb wait-for-device` (not `-no-snapshot-save`: the next boot reverts to the old snapshot and loses installed dev builds). Locale en-US (app follows it; the launch subflow also taps EN).
- Dev build: `adb shell dumpsys package com.littleworld.littleworldapp.dev | grep versionName` must match the checkout's version; CI dev APKs land in `builds/production/*-development-android.apk` (`adb install -r`). A JS error like "Native module … is not registered" = dev build too old.
- Backend: the backend repo's stack on `localhost:8000` with the dev e2e APIs and `dev/envs/test.env` loaded on top of its `.env` (accepts the integrity bypass token).
- Metro (in the checkout, background): `EXPO_PUBLIC_INTEGRITY_BYPASS_TOKEN='bypassChangeMe!' pnpm start --clear` (`docs/DEVELOPMENT.md#simulator--emulator-login`). Without it login fails on emulators ("connecting to the service in the Play Store has failed").
- `adb reverse tcp:9000 tcp:9000; adb reverse tcp:8000 tcp:8000`.

## Scripted flows

```python
import sys
sys.path.insert(0, "e2e_simulations/tests")
from playwright.sync_api import sync_playwright
from _android import android_device, login_app, maestro, start_maestro, finish
from _flows import FAKE_MEDIA_ARGS, create_match, login, new_user_context, open_chat, partner_chat_uuid, send_message

base_url, device = "http://localhost:8000", android_device()
with sync_playwright() as p:
    browser = p.chromium.launch(args=FAKE_MEDIA_ARGS)
    match = create_match(p.request.new_context(), base_url)
    volunteer = login(new_user_context(browser, base_url), base_url, match["volunteer"])
    open_chat(volunteer, base_url, partner_chat_uuid(volunteer, base_url))
    login_app(device, base_url, match["learner"], "open_partner_chat", PARTNER=match["volunteer_name"])  # ~35 s
    reply = start_maestro(device, base_url, "wait_for_message", "send_message", EXPECTED="hi", TEXT="hello")
    send_message(volunteer, "hi")
    finish(reply)
```

Run with `e2e_simulations/.venv/bin/python` (created by one `run_android.sh` run). Headless browser by default.

## Gotchas

- Login: `login_app` / `token_login` set backend tokens through the dev-only `littleworld-dev://e2e-login?access=…&refresh=…` link (`app/e2e-login.tsx`) — ~8 s, also switches users; `login` types into the form (~20 s), use it only to test the form.
- Opening the app by hand (e.g. for the maestro MCP): `adb shell am start -a android.intent.action.VIEW -d "'littleworld-dev://expo-development-client/?url=http%3A%2F%2Flocalhost%3A9000&disableOnboarding=1&disableFab=1&disableAutoLaunch=1'"` — loads Metro without the dev menu and Tools button (flags belong on the outer link, not the Metro URL).
- Each Maestro call starts in ~9 s: batch subflows into one call, start it before the web side acts.
- Taps on the webview need `waitToSettleTimeoutMs` (a blinking cursor never settles) and `retryTapIfNoChange: false` where a second tap would undo the first (menus, lobby).
- The keyboard covers the chat composer and Send (webview does not resize): hide it first.
- During calls each Maestro step can take ~30 s; screen dumps ~90 s.
- Web app in the emulator's Chrome: `context = android_chrome(p, device, base_url)` (clears Chrome), then `login(context, …)` and the usual `_flows.py` helpers. One user per device; Chrome's camera needs ~10 s before Join call enables.
- Video: `record_app_and_pages(device, label, {label: page}, out_dir, name)` → one mp4, phone next to phone-sized pages.
