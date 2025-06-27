# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

## Development Flow

This project supports two development modes to accommodate different testing needs:

### Development Modes

#### 1. Development Build Mode (Default)
- **Purpose**: Full feature testing including LiveKit video calls
- **Features**: All native modules, LiveKit integration, complete functionality
- **Limitations**: Requires EAS build, slower development cycle
- **Best for**: Testing LiveKit features, native module integration

#### 2. Expo Go Mode
- **Purpose**: UI/UX testing and navigation flow
- **Features**: Navigation, UI components, basic app flow
- **Limitations**: No LiveKit, no native modules
- **Best for**: UI development, navigation testing, rapid iteration

### Usage

#### Development Build Mode (Default)
```bash
# Start with development build (LiveKit enabled)
npm run start
npm run android
npm run ios

# Or explicitly
npm run start:dev-build
npm run android:dev-build
npm run ios:dev-build
```

#### Expo Go Mode
```bash
# Start with Expo Go (LiveKit disabled) - automatically clears cache
npm run start:expo-go
npm run android:expo-go
npm run ios:expo-go
```

### Environment Configuration

The mode is controlled by the `EXPO_PUBLIC_USE_EXPO_GO` environment variable:

- `EXPO_PUBLIC_USE_EXPO_GO=true` → Expo Go mode
- `EXPO_PUBLIC_USE_EXPO_GO=false` or unset → Development Build mode

### How It Works

#### Configuration
- `app.config.ts`: Conditionally includes LiveKit plugins based on environment
- `src/config/environment.ts`: Provides helper functions to check current mode
- `app/_layout.tsx`: Conditionally imports and registers LiveKit globals

#### Components
- `CallSetup.tsx` and `Video.tsx`: Show different content based on mode
- Expo Go mode shows mock screens with clear warnings
- Development Build mode shows real LiveKit implementation

#### Mock Screens
When in Expo Go mode, the call screens display:
- Clear indication of current mode
- Warning about LiveKit unavailability
- Mock UI for testing navigation
- Recommendation to use development build for full features

### Switching Between Modes

1. **Stop the current development server**
2. **Run the appropriate script** for your desired mode
3. **Clear Metro cache** if needed: `npx expo start --clear`

### Troubleshooting

#### LiveKit Not Working
- Ensure you're using development build mode
- Check that `EXPO_PUBLIC_USE_EXPO_GO` is not set to `true`
- Verify EAS build includes LiveKit plugins

#### Navigation Issues
- Both modes support the same navigation structure
- Mock screens maintain the same routing behavior
- Use Expo Go mode for rapid navigation testing

#### Build Issues
- Development build mode requires EAS CLI and Apple Developer account
- Expo Go mode works with standard Expo CLI
- Clear cache and reinstall dependencies if needed

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
