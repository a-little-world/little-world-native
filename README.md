# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

## 🚀 Team Development Setup

### Quick Start for Team Members

**For UI/UX Development (No Login Required):**
```bash
# Clone and setup
git clone <repository-url>
cd little-world-native
npm install

# Start with Expo Go (no login required)
npm run start:expo-go
```

**For Full Features (Requires Dev Build):**
```bash
# Setup as above, then create a dev build
npm run start:dev-build
```

### Development Modes

#### 1. Expo Go Mode (Recommended for UI/UX work)
- **Purpose**: UI/UX testing and navigation flow
- **Features**: Navigation, UI components, basic app flow, Redux, translations
- **Limitations**: No LiveKit video calls (shows mock screens)
- **No login required**: Works for all team members immediately
- **Best for**: UI development, navigation testing, rapid iteration

#### 2. Development Build Mode (For full features)
- **Purpose**: Full feature testing including LiveKit video calls
- **Features**: All native modules, LiveKit integration, complete functionality
- **Limitations**: Requires dev build creation and login (see instructions below)
- **Best for**: Testing LiveKit features, native module integration

### Creating Development Builds

When you need to test LiveKit features or native modules, you'll need to create a development build. Here's how:

#### Prerequisites
- Expo account (free)
- EAS CLI installed: `npm install -g @expo/cli`
- For iOS: Apple Developer account (paid)
- For Android: Google Play Console account (free)

#### Step 1: Install EAS CLI and Login
```bash
npm install -g @expo/cli
eas login
```

#### Step 2: Configure EAS (First time only)
```bash
eas build:configure
```

#### Step 3: Create Development Build

**For iOS:**
```bash
# Create iOS development build
eas build --platform ios --profile development

# Download and install the build
eas build:run --platform ios
```

**For Android:**
```bash
# Create Android development build
eas build --platform android --profile development

# Download and install the build
eas build:run --platform android
```

#### Step 4: Start Development Server
```bash
# Start the development server
npm run start:dev-build

# Or for specific platform
npm run android:dev-build
npm run ios:dev-build
```

### Team Collaboration Solutions

#### Issue 1: Expo Go Login Requirement ✅ SOLVED
**Solution**: The project is configured with conditional settings. When using `npm run start:expo-go`, the configuration automatically:
- Sets `owner: undefined` (allows anonymous access)
- Removes LiveKit plugins (not needed for UI work)
- Removes EAS projectId (not needed for Expo Go)

#### Issue 2: EAS Build Permissions ✅ SOLVED
**Solution**: Each team member needs their own Expo account and must create their own development builds. The project owner should:

1. **Add team members to the Expo project** (if using Expo's team features)
2. **Or have each member create their own builds** using the steps above

#### Alternative: Shared Development Builds
If you want to avoid individual builds, you can:

1. **Create shared development builds** and distribute the `.ipa` (iOS) or `.apk` (Android) files
2. **Use a shared Expo account** for the team (not recommended for security)
3. **Set up a CI/CD pipeline** to create builds automatically

### Usage

#### Expo Go Mode (No Login Required)
```bash
# Start with Expo Go (LiveKit disabled) - automatically clears cache
npm run start:expo-go
npm run android:expo-go
npm run ios:expo-go
```

#### Development Build Mode
```bash
# Start with development build (LiveKit enabled)
npm run start:dev-build
npm run android:dev-build
npm run ios:dev-build
```

### Environment Configuration

The mode is controlled by the `EXPO_PUBLIC_USE_EXPO_GO` environment variable:

- `EXPO_PUBLIC_USE_EXPO_GO=true` → Expo Go mode (no login, no LiveKit)
- `EXPO_PUBLIC_USE_EXPO_GO=false` or unset → Development Build mode (login required, full features)

### Troubleshooting

#### Expo Go Issues
- **"Login required" error**: Make sure you're using `npm run start:expo-go` (not just `npm start`)
- **Cache issues**: Run `npx expo start --clear` to clear cache
- **Metro bundler issues**: Try `npm run reset-project`

#### Development Build Issues
- **Build fails**: Check that you're logged into EAS (`eas login`)
- **Permission denied**: Make sure you have access to the Expo project
- **iOS build fails**: Verify Apple Developer account and certificates
- **Android build fails**: Check Google Play Console setup

#### General Issues
- **Port conflicts**: Change port in scripts (currently using 9000)
- **Device not found**: Make sure simulator/emulator is running
- **Metro bundler stuck**: Kill the process and restart

## Translations

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

### Developing & Fixing Components

```bash
git submodule update --init --recursive # the 'little-world-design-system-native' is cloned in 'lw_components'
npm install
npm run start # starts expo react-native ( for web version )
./_scripts/pack_and_update.sh # run to update the native components when you've made changes to the 'lw_components'
```

### ReactWeb -> ReactNative conversion cheatsheet

- `styled.div` -> `styled.View`
- `styled.span` -> `styled.Text`
- `styled.a` -> `styled.TouchableOpacity`
- `styled.button` -> `styled.Button`
- `styled.input` -> `styled.TextInput`
- `styled.img` -> `styled.Image`
- `styled.form` -> `styled.Form`

*Also you CAN NOT use the following css properties:*

- `box-shadow`
- `linear-gradient`
- `@media(...)` querries

*They will break the native app with weird errors!*

Other things that can break native:

- Don't use arrays in the `style={}` prop!

```CSS2Properties doesn't have an indexed property setter for '0'
```

### react-native useWindowDimensiions instead of @media -queries

see `components/blocks/Header.jsx` as an example how.

### Using SVG's in react native

- https://stackoverflow.com/questions/38830568/how-to-show-svg-file-on-react-native

This error *almost always originates from wronly merged styles* e.g.:

breaks very fast by accidently setting a css prop twice:
```javascript
const Text = React.forwardRef<any, TextProps>(({
  bold = false,
  center = false,
  children,
  color,
  className,
  disableParser = false,
  id,
  style,
  tag = 'p',
  type = TextTypes.Body5,
  ...restProps
}, ref) => {

  return (
    <StyledElement
      ref={ref}
      style={style}
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

Manages merging text styles:

```javascript
const Text = React.forwardRef<any, TextProps>(({
  bold = false,
  center = false,
  children,
  color,
  className,
  disableParser = false,
  id,
  style,
  tag = 'p',
  type = TextTypes.Body5,
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
      style={[...textStyles, style]}
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

- React Native `<Button>` Doesn't accept `{children}` only a `title`, use (`TouchableOpacity`) instead.
```

### Linking Local Design System Package

The app uses a local version of the design system package. To set this up:

1. Make sure you have the design system repository cloned at `../little-world-design-system` relative to this project
2. In the design system repository:
   ```bash
   cd packages/native
   npm install
   npm run build  # if needed
   ```
3. In this repository:
   ```bash
   npm install
   ```
4. If you make changes to the design system:
   ```bash
   # In the design system repository
   cd packages/native
   npm run build
   
   # In this repository
   npm install  # This will pick up the changes
   ```

Note: The package is linked using a local file dependency in package.json. This allows for easier development and testing of the design system package.
