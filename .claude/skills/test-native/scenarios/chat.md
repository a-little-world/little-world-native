# Match chat (app ↔ web)

1. `create_match` → learner in the app (`login_app(..., "open_partner_chat", PARTNER=match["volunteer_name"])`), volunteer on web (`open_chat`).
2. App → web: `maestro(..., "send_message", TEXT=...)`, web `wait_for_message`.
3. Web → app: start `wait_for_message` (`EXPECTED=...`) in the background, then web `send_message`, then `finish`.

Expect: the message on both sides with read ticks; `open_partner_chat` goes menu → Messages → the chat whose entry contains `PARTNER` (the partner's first name: `create_match` returns `learner_name` / `volunteer_name`; `Support Team` for the support chat; unset → the first "Test <hex>").
Sanity test: `test_chat_between_web_and_app`.
