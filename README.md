# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

### Developing & Fixing Components

```bash
git submodule update --init --recursive # the 'little-world-design-system-native' is cloned in 'lw_components'
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

```
CSS2Properties doesn't have an indexed property setter for '0'
```

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