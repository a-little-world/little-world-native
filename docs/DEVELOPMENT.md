# Development

## Prerequisites

- Node.js 24 (see [`.nvmrc`](../.nvmrc))
- pnpm (version pinned in [`package.json`](../package.json), `corepack enable` picks it up)
- Xcode (iOS) and/or Android Studio (Android), only for local builds

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
pnpm frontend:setup
```

## Configuration

Edit [`environment.ts`](../environment.ts) at the repo root to choose the backend:

```ts
export const environment: Environment = {
  backendUrl: 'http://localhost:8000',
  ...
};
```

- Copied to `frontend/src/environment.ts` by `pnpm frontend:setup` (also run by `pnpm start`). Don't edit the copy.
- On a physical device, use your machine's LAN IP instead of `localhost`.
- Native variant config (bundle ID, Firebase, Sentry) lives in [`environments/`](../environments). Local builds use [`env.ts`](../environments/env.ts) (Dev variant); CI swaps in [`env.staging.ts`](../environments/env.staging.ts) / [`env.prod.ts`](../environments/env.prod.ts).

## Running

```bash
pnpm start
```

Syncs [`environment.ts`](../environment.ts), builds the frontend type declarations, then starts Metro on port 9000. Extra flags are passed through to `expo start`, e.g. `pnpm start --clear` or `pnpm start --tunnel`.

Everything else is done from the Metro terminal:

| Key                   | Action                                   |
| --------------------- | ---------------------------------------- |
| `a` / `i` / `w`       | open on Android / iOS / web              |
| `shift+a` / `shift+i` | choose Android / iOS device or simulator |
| `r`                   | reload app                               |
| `m`                   | toggle dev menu                          |
| `?`                   | show all commands                        |

Native modules (LiveKit, Firebase) need a development build. Expo Go is not supported. Rebuild only when native code or dependencies change; JS changes load from Metro.

### Behind a reverse proxy

For serving Metro through a public domain that points to your machine (e.g. via NetBird, Tailscale), such as HTTPS for testing video calls on a phone.

Unless the proxy listens on port 9000 and forwards that port to your machine, set `EXPO_PACKAGER_PROXY_URL`:

```bash
EXPO_PACKAGER_PROXY_URL=https://<public-domain> pnpm start
```

Otherwise the app tries to load the bundle from `<public-domain>:9000`.

## Development builds

Profiles ([`eas.json`](../eas.json)):

- `simulator`: iOS simulator
- `development`: physical devices (iOS + Android), Android emulator

Some features only work on a physical device, not in a simulator/emulator:

- push notifications
- app integrity checks (login fails without the [bypass](#simulator--emulator-login))

### Simulator / emulator login

Start Metro with an integrity bypass token:

```bash
EXPO_PUBLIC_INTEGRITY_BYPASS_TOKEN='bypassChangeMe!' pnpm start
```

- Always used when set, regardless of the **Bypass integrity checks** settings in the [Debug Panel](DEBUGGING.md#debug-panel). Those settings stay saved on the device and apply again once the token is unset. The panel shows the saved settings, not the token.
- Only read by [`environments/env.ts`](../environments/env.ts) (Dev variant), so staging and production builds never bypass.
- The backend must accept the same token: load `dev/envs/test.env` on top of its `.env`, see "Testing the native app on a simulator / emulator" in the [backend docs](https://github.com/a-little-world/little-world-backend-docs/blob/main/README.md).

### EAS cloud

Requires access to the Expo project (`pnpm exec eas login`).

```bash
pnpm exec eas build --platform <ios|android> --profile <profile>

# e.g.
pnpm exec eas build --platform android --profile development
```

Install the latest build on a simulator / emulator (iOS: `simulator` profile builds only):

```bash
pnpm exec eas build:run --platform <ios|android> --latest
```

### EAS local

Same build, run on your machine. Requires Xcode / Android Studio.

Also requires access to the Expo project: signing credentials are fetched from EAS (`credentialsSource: remote`).

```bash
pnpm exec eas build --platform <ios|android> --profile <profile> --local
```

Writes the artifact (`.ipa`, `.apk`, `.tar.gz`, ...) to the repo root.

### Without Expo access

Debug build with local signing, installed directly on a simulator / connected device. Requires Xcode / Android Studio.

```bash
pnpm exec expo run:ios
pnpm exec expo run:android
```

Add `-d` to pick a device.

### GitHub Actions

**Actions -> Build Application -> Run workflow** ([`build-application.yml`](../.github/workflows/build-application.yml)):

- pick profile, backend URL and platforms
- `buildLocally`: build in the GitHub runner instead of on EAS

On PRs, adding the label `build-android` or `build-ios` builds that platform on every push (`staging` profile against `https://stage.little-world.com`).

## Checks

Same as CI ([`checks.yml`](../.github/workflows/checks.yml)):

```bash
pnpm lint
pnpm typecheck
pnpm format:check   # or: pnpm format
```

`pnpm typecheck` uses the frontend type declarations. Re-run `pnpm frontend:setup` after frontend type changes (`pnpm start` does this too).

Not in CI, but worth running after dependency changes:

```bash
pnpm exec expo-doctor
```

E2E tests live in the `e2e_simulations/` submodule. See its README.

## Frontend submodule

`frontend/` is pinned to a commit of [little-world-frontend](https://github.com/a-little-world/little-world-frontend). It's a regular git repo, so branch, commit and push inside it as usual.

1. Make the change in `frontend/` and open a PR in the frontend repo.
2. After it's merged to `main`, [`update-submodules.yml`](../.github/workflows/update-submodules.yml) opens a `chore/update-submodules` PR here that bumps the pointer and syncs [shared dependencies](#dependencies).

PRs here fail [`submodules-up-to-date.yml`](../.github/workflows/submodules-up-to-date.yml) unless every submodule is at its `main` HEAD. To bump manually:

```bash
git -C frontend fetch origin main
git -C frontend checkout --detach origin/main
git add frontend
```

## Dependencies

- **Shared with frontend** (keys of `pnpm.overrides` in [`package.json`](../package.json): `react`, `swr`, `zustand`, ...): pinned to the versions in `frontend/pnpm-lock.yaml`. Bump them in the frontend; the submodule bump PR syncs them here. Checked by [`lockfile.yml`](../.github/workflows/lockfile.yml). To sync manually:

  ```bash
  node .github/scripts/sync-shared-deps.mts --fix
  pnpm install
  ```

  A new shared dependency goes into `pnpm.overrides` and the "Shared with frontend" rule in [`renovate.json`](../renovate.json).

- **Expo SDK packages**: install with `pnpm exec expo install <package>` to get the version matching the SDK.

## Debugging

See [DEBUGGING.md](DEBUGGING.md).

## Troubleshooting

### Metro: stale cache, "Unable to resolve module"

Usually stale caches, not a dependency issue. Stop Metro, then:

```bash
./_scripts/fix-watchman.sh
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
