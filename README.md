# Little World Native Expo

This is the native expo app for Little World.

> This is very much in an MVP state!

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
