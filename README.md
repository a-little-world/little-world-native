# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

## 🚀 Quick Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Git

### Installation & Setup

```bash
# Clone both repositories
git clone https://github.com/a-little-world/little-world-frontend
git clone https://github.com/a-little-world/little-world-native

# Navigate to the native app
cd little-world-native

# Run the pack and update script
# This basicly packs our little-world-frontend ( from the parent dir ) into a local npm package
# That package is then installed inside the little-world-native repo
./_scripts/pack_and_update.sh

# Install dependencies
pnpm install

# Start the development server
pnpm run start
```

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