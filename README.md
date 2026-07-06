# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

## 🚀 Quick Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Git

### Installation & Setup

The `little-world-frontend` repository is included as a git submodule under `./frontend`. There is no longer a separate clone or pack/update step — `pnpm run start` syncs your local `environment.ts` into the submodule automatically (see `_scripts/setup_local_frontend.sh`).

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/a-little-world/little-world-native
cd little-world-native

# (Or, if you already cloned without --recurse-submodules:)
git submodule update --init --recursive

# Install dependencies
pnpm install

# Start the development server
pnpm run start
```

#### Configuring environment variables

Edit `environment.ts` at the repo root to point the app at the backend you want to use (e.g. local, staging, production). On every `pnpm run start`, this file is copied to `frontend/src/environment.ts` so the shared frontend code picks up the same values.

Do not edit `frontend/src/environment.ts` directly — it is overwritten on each start.

## 🌐 Development Proxy for WebSocket Testing

To test WebSocket functionality, you need to use the development proxy:

```bash
# Start the development proxy
pnpm run dev:proxy
```

Then you can access the mobile web version at `localhost:9001` where WebSockets will work properly.

## 🔧 Creating Development Builds

When you need to test LiveKit features or native modules, you'll need to create a development build:

### Prerequisites

- Expo account (free)
- EAS CLI installed: `pnpm install -g @expo/cli`
- For iOS: Apple Developer account (paid)
- For Android: Google Play Console account (free)

### Setup Steps

```bash
# Install EAS CLI and login
pnpm install -g @expo/cli
eas login

# Configure EAS (first time only)
eas build:configure

# Create development build for iOS
eas build --platform ios --profile development
eas build:run --platform ios

# Create development build for Android
eas build --platform android --profile development
eas build:run --platform android
```

### Expo doctor

To automatically check the project for any expo warnings run:

```bash
pnpm exec expo-doctor
```

## 🔀 Pull Requests

We use [release-please](https://github.com/googleapis/release-please) to automate versioning and changelog generation. It reads the **PR title** of every merged PR and uses [Conventional Commits](https://www.conventionalcommits.org/) to decide what the next release looks like. Formatting your PRs correctly is therefore required for releases to work.

### PR title format

```
<type>[optional scope]: <subject>
```

The title is linted by `.github/workflows/lint-pr-title.yml`. Allowed types:

| Type       | When to use                                                                      | Affects release? |
| ---------- | -------------------------------------------------------------------------------- | ---------------- |
| `feat`     | New user-facing feature                                                          | minor bump       |
| `fix`      | Bug fix                                                                          | patch bump       |
| `perf`     | Performance improvement                                                          | patch bump       |
| `refactor` | Internal restructuring with no behavior change                                   | no bump          |
| `docs`     | Documentation only                                                               | no bump          |
| `test`     | Tests only                                                                       | no bump          |
| `build`    | Build system / dependencies                                                      | no bump          |
| `ci`       | CI configuration                                                                 | no bump          |
| `chore`    | Other maintenance (renames, formatting, dependency bumps that don't fit `build`) | no bump          |
| `style`    | Code style / formatting                                                          | no bump          |

Scope is optional and free-form (e.g. `feat(auth):`, `fix(android):`).

The subject must start with a letter, no trailing period, ideally under ~70 chars.

✅ `feat: add automatic login on app start`
✅ `fix(ios): correct keyboard avoidance on chat screen`
❌ `Update auth stuff` ← no type
❌ `feat:` ← missing subject
❌ `feat: Updated auth.` ← past tense + trailing period (not strictly enforced, but avoid)

### PR description (body)

Whatever you write in the PR description becomes the body of the merge commit (because the repo is configured with `merge_commit_message: PR_BODY`). It is shown in expanded changelog notes and in `git show <sha>`. Use it freely for context:

- bullet list of changes
- "why" and motivation
- screenshots, links, test plan, anything

Markdown, links, headings — all fine. The conventional-commits parser only reads the **subject** and the **footer**; everything in between is just human context.

### Footers

Footers are key/value lines at the **very end** of the PR description, separated from the body by a blank line, with nothing after them. They drive semver bumps and GitHub side effects.

```
feat(auth): overhaul login flow

- add automatic login on app start using a stored refresh token
- replace generic "Something went wrong" with field-specific error messages
- refresh the session gracefully when the token expires mid-session

BREAKING CHANGE: the /auth/v1 endpoint and the `legacyLogin()` client helper have been removed. Consumers must call `login()` from `@little-world/auth`.
Closes #123
```

| Footer                    | Effect                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `BREAKING CHANGE: <desc>` | Forces a **major** version bump and shows up in the changelog under "⚠ BREAKING CHANGES". |
| `Closes #N` / `Fixes #N`  | GitHub auto-closes the linked issue when the PR merges.                                   |

Shorthand: `feat!:` in the subject also marks a breaking change, but the `BREAKING CHANGE:` footer is preferred because it lets you describe _what_ broke.

**Rules to remember:**

- The footer must be the **last paragraph**. Anything after it (a stray link, a screenshot) will break footer detection.
- One blank line separates body from footer.
- `BREAKING CHANGE` is case-sensitive (uppercase, space, hyphen).

### One PR, one type

If a PR mixes a new feature and an unrelated bugfix, split it into two PRs. Release-please routes by the type in the subject — you can only pick one. Bundle bullets in the body only when they describe one cohesive change.

### Merge strategy

The repo only allows **merge commits** — squash and rebase are disabled. The merge commit is configured to use the **PR title** as its subject (`merge_commit_title: PR_TITLE`) and the **PR description** as its body (`merge_commit_message: PR_BODY`), so release-please reads the PR title verbatim. Make sure the PR title is conventional; individual commits on the feature branch don't need to be.

## 🚢 Releases

The app ships in three independent variants, each a separate store app with its own bundle ID (configured per environment in `environments/`):

| Variant | Bundle ID                             | Name                | Distribution                   |
| ------- | ------------------------------------- | ------------------- | ------------------------------ |
| Dev     | `com.littleworld.littleworldapp.dev`  | Little World (Dev)  | Local / ad-hoc only (no store) |
| Beta    | `com.littleworld.littleworldapp.beta` | Little World (Beta) | TestFlight + Play internal     |
| Prod    | `com.littleworld.littleworldapp`      | Little World        | App Store + Play production    |

**Beta and production are two independent tracks.** Production is driven by automated release-please workflow; beta is a manual workflow. Releasing a beta does not touch the `main` branch or bump the version.

### Shipping to production

1. Merge PRs with conventional titles (see [Pull Requests](#-pull-requests)). release-please maintains a **Release PR** that bumps the version in `app.config.ts` and updates the changelog.
2. Merge that Release PR. release-please tags the commit and publishes a GitHub release `vX.Y.Z`.
3. The published release triggers **`production-release.yml`**, which builds both platforms with the `production` EAS profile, submits to the App Store + Play production track, attaches the `.ipa`/`.aab` to the release, and notifies Sentry.

### Releasing a beta

1. **Actions → Staging (Beta) Release → Run workflow** (from `main`).
2. It builds the current `main` with the `staging` EAS profile, submits to TestFlight + Play internal, attaches artifacts to a GitHub **pre-release** `vX.Y.Z-beta.<run>`, and notifies Sentry (`lw-staging-native`).

Run it as often as you like between production releases - each run gets a fresh build number so uploads never collide.

### Versions & build numbers

- **Marketing version** (`1.0.31`, shown to users) comes from `APP_VERSION` in `app.config.ts` and is owned by release-please. Betas carry whatever version `main` is currently at.
- **Build number** (`CFBundleVersion` / Android `versionCode`) is a monotonic "which upload" counter, separate from the marketing version:
  - **Prod** derives it from the semver - each version ships once, so it stays unique.
  - **Beta** injects the CI run number (`EAS_BUILD_NUMBER`) at build time, so repeated betas at the same marketing version don't collide.
- Both stores **require the build number to strictly increase** per upload (across all tracks of an app), and beta/prod are separate apps with independent sequences.

## 🌍 Translations

This app uses i18next for internationalization and merges translations from two sources:

1. **Shared translations** from `@a-little-world/little-world-frontend-shared` package (base translations)
2. **Local translations** in `src/locale/` (mobile app specific translations)

### Translation Structure

- **Shared translations**: Common translations used across all Little World applications
  - View existing translations: [@a-little-world/little-world-frontend-shared/translations](https://github.com/a-little-world/little-world-frontend-shared/tree/main/src/translations)
  - Add new shared translations to the shared package repository

- **Local translations**: Mobile app specific translations only
  - Location: `src/locale/de.json` and `src/locale/en.json`
  - **Only add translations here that are specific to the mobile app**
  - Local translations override shared translations (local takes precedence)

### Adding Translations

1. **For shared/common translations**: Add them to the [shared package repository](https://github.com/a-little-world/little-world-frontend-shared/tree/main/src/translations)
2. **For mobile-specific translations**: Add them to `src/locale/de.json` and `src/locale/en.json`

The translation merging is handled automatically in `src/i18n.ts`.

## 🔄 React Web → React Native Conversion Guide

### Component Mapping

- `styled.div` → `styled.View`
- `styled.span` → `styled.Text`
- `styled.a` → `styled.TouchableOpacity`
- `styled.button` → `styled.Button`
- `styled.input` → `styled.TextInput`
- `styled.img` → `styled.Image`
- `styled.form` → `styled.Form`

### CSS Properties to Avoid

**These CSS properties will break the native app with weird errors:**

- `box-shadow`
- `linear-gradient`
- `@media(...)` queries

### Common Issues & Solutions

If your local iOS build fails with: error: exportArchive Copy failed:
Take look at produced logs found in. The path will be logged a few lines before the error and look something like this:
`Logging _createLoggingBundleAtPath:]: Created bundle at path "/var/folders/8h/0jk2h57s643fvbdqgf3c4f980000gn/T/littleworldapp_2026-05-07_16-02-16.748.xcdistributionlogs".` If the contained `IDEDistributionPipeline.log` show something like this at the very end:

```
2026-05-07 14:02:18 +0000 [MT] Running /usr/bin/rsync ...
2026-05-07 14:02:18 +0000  rsync: on remote machine: --extended-attributes: unknown option
2026-05-07 14:02:18 +0000  rsync error: syntax or usage error (code 1) at main.c(1802) [server=3.4.1]
2026-05-07 14:02:18 +0000  rsync(62991): error: unexpected end of file
2026-05-07 14:02:18 +0000 [MT] /usr/bin/rsync exited with 1
```

You might have installed a separate version of rsync. The rsync that comes bundled with MacOS/Xcode is modified by apple.
Try running `rsync --extended-attributes --version`. If that fails because `--extended-attributes` is an unknown option, then the build is using the wrong rsync. Easiest solve is to remove it or change the path to point to the system rsync at `/usr/bin/rsync`. What is confusing about this, is that the build uses the correct rsync, but the server (I guess the receiving folder/process) is using the system rsync. This can also be seen in the log, where in this example the server uses version [server=3.4.1], whereas the `/usr/bin/rsync` is a different version.

#### Style Array Issues

**Don't use arrays in the `style={}` prop!** This will cause errors like:

```
CSS2Properties doesn't have an indexed property setter for '0'
```

#### Responsive Design

Use `useWindowDimensions` instead of `@media` queries. See `components/blocks/Header.jsx` as an example.

#### SVG Usage

For SVG support in React Native, see: https://stackoverflow.com/questions/38830568/how-to-show-svg-file-on-react-native

#### Style Merging Best Practices

**❌ Wrong way (breaks easily):**

```javascript
const Text = React.forwardRef<any, TextProps>(({
  bold = false,
  center = false,
  children,
  style,
  ...restProps
}, ref) => {
  return (
    <StyledElement
      ref={ref}
      style={style}  // This can cause conflicts
      $type={type}
      $bold={bold}
      $center={center}
      {...restProps}
    >
      {children}
    </StyledElement>
  );
});
```

**✅ Correct way (manages merging properly):**

```javascript
const Text = React.forwardRef<any, TextProps>(({
  bold = false,
  center = false,
  children,
  style,
  ...restProps
}, ref) => {
  const textStyles = [
    styles.base,
    type === TextTypes.Heading1 && styles.heading1,
    // ... other type conditions
    bold && styles.bold,
    center && styles.center,
  ].filter(Boolean);

  return (
    <StyledElement
      ref={ref}
      style={[...textStyles, style]}  // Proper style merging
      $type={type}
      $bold={bold}
      $center={center}
      {...restProps}
    >
      {children}
    </StyledElement>
  );
});
```

#### Button Component

React Native `<Button>` doesn't accept `{children}` - only a `title`. Use `TouchableOpacity` instead for custom button content.

## 🔗 Linking Local Design System Package

The app uses a local version of the design system package. To set this up:

1. Make sure you have the design system repository cloned at `../little-world-design-system` relative to this project
2. In the design system repository:
   ```bash
   cd packages/native
   pnpm install
   pnpm run build  # if needed
   ```
3. In this repository:
   ```bash
   pnpm install
   ```
4. If you make changes to the design system:

   ```bash
   # In the design system repository
   cd packages/native
   pnpm run build

   # In this repository
   pnpm install  # This will pick up the changes
   ```

Note: The package is linked using a local file dependency in package.json. This allows for easier development and testing of the design system package.
