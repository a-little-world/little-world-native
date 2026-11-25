# Match video calls (app ↔ web)

- Web → app: web `start_call` (chat → Video Call Icon → Join call), app `answer_call`: "<name> is calling you…" → Join call → setup dialog ("Would you like to join this conversation?", camera "camera2 0, facing back") → Join call (disabled until the preview runs) → "End call".
- App → web: app `open_partner_chat` (`PARTNER=match["volunteer_name"]`) + `start_call` in the background, web `answer_call(timeout=180000)`, then `finish`.
- `end_call` on each side.

Expect: each side sees the other's video (emulator camera: a still pixel-art scene; Chrome: the blue "Fake camera" frame).
Sanity tests: `test_call_from_web_to_app`, `test_call_from_app_to_web`.
