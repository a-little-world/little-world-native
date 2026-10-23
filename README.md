# Little World Native

Expo / React Native app for Little World (iOS, Android, web).

Setup and day-to-day development: see [DEVELOPMENT.md](DEVELOPMENT.md).

## Repository layout

| Path               | Contents                                                                 |
| ------------------ | ------------------------------------------------------------------------ |
| `app/`             | Expo Router routes                                                       |
| `src/`             | Native app code (components, API, store, translations)                   |
| `frontend/`        | Submodule: [little-world-frontend], rendered as a DOM component          |
| `e2e_simulations/` | Submodule: [little-world-e2e-tests]                                      |
| `modules/`         | Local Expo modules (`call-audio`)                                        |
| `environments/`    | Per-variant native config (bundle ID, Firebase, Sentry)                  |
| `environment.ts`   | Backend URL etc. for local development, synced into `frontend/` on start |

[little-world-frontend]: https://github.com/a-little-world/little-world-frontend
[little-world-e2e-tests]: https://github.com/a-little-world/little-world-e2e-tests

## Pull requests

Versioning and changelog are automated with [release-please](https://github.com/googleapis/release-please), which reads the **PR title** of each merged PR. Titles must follow [Conventional Commits](https://www.conventionalcommits.org/) (checked by `lint-pr-title.yml`).

### Title

```
<type>[optional scope]: <subject>
```

| Type                                                        | Release effect |
| ----------------------------------------------------------- | -------------- |
| `feat`                                                      | minor bump     |
| `fix`, `perf`                                               | patch bump     |
| `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `style` | none           |

- Scope is optional and free-form, e.g. `fix(android):`
- Subject starts with a letter, imperative mood, no trailing period, ideally under 70 chars
- One type per PR. Split unrelated features and fixes into separate PRs.

```
feat: add automatic login on app start            # ok
fix(ios): correct keyboard avoidance on chat screen # ok
Update auth stuff                                 # no type
feat: Updated auth.                               # past tense, trailing period
```

### Description

- Becomes the body of the merge commit. Use it for context, test plan, screenshots.
- Optional footers go in the **last paragraph**, separated by one blank line, with nothing after them:

```
- add automatic login using a stored refresh token
- show field-specific login errors

BREAKING CHANGE: `legacyLogin()` was removed, use `login()` instead.
Closes #123
```

| Footer                    | Effect                      |
| ------------------------- | --------------------------- |
| `BREAKING CHANGE: <desc>` | major bump (case-sensitive) |
| `Closes #N` / `Fixes #N`  | closes the issue on merge   |

`feat!:` also marks a breaking change, but the footer is preferred since it describes what broke.

### Merging

Merge commits only (no squash/rebase). The merge commit uses the PR title as subject, so individual branch commits don't need conventional messages.

## Releases

Three variants, each a separate store app:

| Variant | Bundle ID                             | Distribution                |
| ------- | ------------------------------------- | --------------------------- |
| Dev     | `com.littleworld.littleworldapp.dev`  | local / ad-hoc only         |
| Beta    | `com.littleworld.littleworldapp.beta` | TestFlight + Play internal  |
| Prod    | `com.littleworld.littleworldapp`      | App Store + Play production |

Beta and prod are independent tracks. A beta release does not touch `main` or bump the version.

### Production

1. Merge PRs with conventional titles. release-please keeps a **Release PR** open that bumps `APP_VERSION` in `app.config.ts` and updates `CHANGELOG.md`.
2. Merge the Release PR. release-please tags the commit and publishes GitHub release `vX.Y.Z`.
3. `production-release.yml` builds both platforms (`production` EAS profile), submits to the stores, attaches the `.ipa`/`.aab` to the release and notifies Sentry.

### Beta

1. **Actions -> Staging (Beta) Release -> Run workflow** on `main`.
2. Builds with the `staging` EAS profile, submits to TestFlight + Play internal, attaches artifacts to pre-release `vX.Y.Z-beta.<run>`.

Can be run any number of times between production releases.

### Version and build numbers

- **Version** (`APP_VERSION` in `app.config.ts`): owned by release-please. Don't edit manually.
- **Build number** (iOS `CFBundleVersion`, Android `versionCode`): must strictly increase per upload.
  - Prod: derived from the version
  - Beta: CI run number (`EAS_BUILD_NUMBER`)

### Verifying the Android APK

Each production release includes a universal APK built from the same AAB and signed with our own key:

```bash
apksigner verify --print-certs little-world_<version>-android.apk
```

The `Signer #1 certificate SHA-256 digest` must match the SHA-256 fingerprint of Little World's signing certificate.

## Translations

i18next, set up in `src/i18n.ts`. Two sources, merged at startup:

- **Shared** ([little-world-frontend-shared](https://github.com/a-little-world/little-world-frontend-shared/tree/main/src/translations)): strings used across all Little World apps. Add common strings there.
- **Local** (`src/locale/en.json`, `src/locale/de.json`): app-specific strings only. Override shared keys.
