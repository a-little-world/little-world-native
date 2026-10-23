# Development

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- pnpm (version pinned in `package.json`, `corepack enable` picks it up)
- Xcode (iOS) and/or Android Studio (Android), only for [local builds](#local)

Use `pnpm exec` for local binaries (`expo`, `eas`, ...), not `npx`.

## Setup

```bash
git clone --recurse-submodules https://github.com/a-little-world/little-world-native
cd little-world-native

# already cloned without submodules:
git submodule update --init --recursive

# hide formatting-only commits from git blame
git config blame.ignoreRevsFile .git-blame-ignore-revs

pnpm install
```

## Configuration

Edit `environment.ts` at the repo root to choose the backend:

```ts
export const environment: Environment = {
  backendUrl: 'http://localhost:8000',
  ...
};
```

- Copied to `frontend/src/environment.ts` on every `pnpm start`. Don't edit the copy.
- On a physical device, use your machine's LAN IP instead of `localhost`.
- Native variant config (bundle ID, Firebase, Sentry) lives in `environments/`. Local builds use `env.ts` (Dev variant); CI swaps in `env.staging.ts` / `env.prod.ts`.

## Running

```bash
pnpm start
```

Syncs `environment.ts`, builds the frontend type declarations, then starts Metro on port 9000.

Native modules (LiveKit, Firebase) need a development build. Rebuild only when native code or dependencies change; JS changes load from Metro.

## Development builds

Profiles (`eas.json`):

- `simulator`: iOS simulator
- `development`: physical devices (iOS + Android), Android emulator

Some features only work on a physical device, not in a simulator/emulator:

- push notifications
- app integrity checks

### Local

Requires Xcode / Android Studio.

```bash
pnpm exec expo run:ios
pnpm exec expo run:android
pnpm android-device        # pick a connected Android device
```

### EAS (cloud)

Requires access to the Expo project.

```bash
pnpm exec eas login

pnpm exec eas build --platform ios --profile simulator
pnpm exec eas build --platform android --profile development

# install the latest build on a simulator / emulator
pnpm exec eas build:run --platform ios
```

### GitHub Actions

**Actions -> Build Application -> Run workflow**:

- pick profile, backend URL and platforms
- `buildLocally`: build in the GitHub runner instead of on EAS

On PRs, adding the label `build-android` or `build-ios` builds that platform on every push.

## Checks

Same as CI (`checks.yml`):

```bash
pnpm lint
pnpm typecheck
pnpm format:check   # or: pnpm format
pnpm exec expo-doctor
```

E2E tests live in the `e2e_simulations/` submodule. See its README.

## Debugging

The app runs two JS engines, each with its own debugger:

- **Native (Hermes)**: app shell, native modules, `src/`
- **WebView**: `frontend/`, rendered as a [DOM component](https://docs.expo.dev/guides/dom-components/) via `src/components/blocks/LittleWorldWebLazy.tsx`

### Native

Press `j` in the Metro terminal. React Native DevTools opens with Console, Sources, Network, Components and Profiler.

### `frontend/` on Android

`frontend/` code does not show up in React Native DevTools. Use Chrome's WebView inspector instead (enabled in dev via `webviewDebuggingEnabled` in `DomWebViewHost.tsx`):

1. Enable USB debugging on the phone and connect it (USB or wireless).
2. Check the connection:

   ```bash
   adb devices
   ```

3. Open a screen that renders the web content, so the DOM component is mounted.
4. Open `chrome://inspect` and click **inspect** on the WebView entry.
5. **Sources -> Page**, quick-open (`Cmd+P` / `Ctrl+P`) a file under `frontend/src/`, set breakpoints.

Ignore the "drop a folder to sync edits" prompt in the **Filesystem** tab. It's not needed for breakpoints.

### `frontend/` without a device

Press `w` in Metro. On web the DOM component renders inline, so `frontend/` is debuggable in regular Chrome DevTools. Not the device runtime, though.

## Troubleshooting

### Metro: stale cache, "Unable to resolve module"

Usually stale caches, not a dependency issue. Stop Metro, then:

```bash
watchman watch-del "$PWD"
watchman watch-project "$PWD"
pnpm start --clear
```

Still broken: `rm -rf node_modules && pnpm install`.

### iOS: `error: exportArchive Copy failed`

1. Find the `.xcdistributionlogs` path printed a few lines above the error.
2. If `IDEDistributionPipeline.log` ends with `rsync: ... --extended-attributes: unknown option`, a non-Apple rsync (e.g. Homebrew) is first in `PATH`.
3. Verify:

   ```bash
   rsync --extended-attributes --version   # fails -> wrong rsync
   ```

4. Remove it or make sure `/usr/bin/rsync` comes first in `PATH`.
