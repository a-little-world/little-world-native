# Random calls on the app (not scripted)

- Entry: home tab "Random Calls Now" (only with random-call access → `setup_random_calls`); swipe the tab row (y ≈ 17 %) left to reach it. Lobby: "Join now", proposal dialog "Accept".
- Not scriptable with Maestro: the proposal must be accepted within 30 s and Maestro on the lobby screen is slower than that ("Call didn't go ahead – Time ran out" on both sides). Test random calls on web (`_flows.join_random_call`) or by hand on the emulator.
- A failed run leaves the app user in the lobby and it gets matched with later test users: `stop_app(device)` (the Android tests do this after each test).
