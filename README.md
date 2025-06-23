# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

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
