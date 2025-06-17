import { Dimensions, Platform, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Button, Card, Text } from '@a-little-world/little-world-design-system-native';
import { useTheme } from 'styled-components/native';

// Get the window width
const windowWidth = Dimensions.get('window').width;

export const createSharedStyles = (theme: any) => StyleSheet.create({
  card: {
    position: 'relative',
    maxWidth: 500,
    alignSelf: 'flex-start',
    flex: 1,
    paddingTop: windowWidth < 500 ? theme.spacing.medium : theme.spacing.small,
    paddingBottom: windowWidth < 500 ? theme.spacing.medium : theme.spacing.small,
  } as ViewStyle,

  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexGrow: 1,
    marginTop: theme.spacing.xxxsmall,
    marginBottom: theme.spacing.xxxsmall,
  } as ViewStyle,

  cta: {
    marginBottom: theme.spacing.xsmall,
  } as ViewStyle,

  title: {
    textAlign: 'center',
    color: theme.color.text.highlight,
    width: '100%',
    marginBottom: theme.spacing.medium,
  } as TextStyle,

  titleColored: {
    textAlign: 'center',
    color: theme.color.text.secondary,
    width: '100%',
    marginBottom: theme.spacing.medium,
  } as TextStyle,

  nameContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginTop: theme.spacing.xxsmall,
    marginBottom: theme.spacing.xxsmall,
  } as ViewStyle,

  nameInputs: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.xxsmall,
    marginBottom: theme.spacing.xxsmall,
  } as ViewStyle,

  formDescription: {
    marginBottom: theme.spacing.small,
  } as TextStyle,
});

// Export styled components that wrap the base components with our styles
export const StyledCard = (props: any) => {
  const theme = useTheme();
  return <Card {...props} style={[props.style, createSharedStyles(theme).card]} />;
};

export const StyledForm = (props: any) => {
  const theme = useTheme();
  return <View {...props} style={[props.style, createSharedStyles(theme).form]} />;
};

export const StyledCta = (props: any) => {
  const theme = useTheme();
  return <Button {...props} style={[props.style, createSharedStyles(theme).cta]} />;
};

export const Title = (props: any) => {
  const theme = useTheme();
  return <Text {...props} style={[props.style, createSharedStyles(theme).title]} />;
};

export const TitleColored = (props: any) => {
  const theme = useTheme();
  return <Text {...props} style={[props.style, createSharedStyles(theme).titleColored]} />;
};

export const NameContainer = (props: any) => {
  const theme = useTheme();
  return <View {...props} style={[props.style, createSharedStyles(theme).nameContainer]} />;
};

export const NameInputs = (props: any) => {
  const theme = useTheme();
  return <View {...props} style={[props.style, createSharedStyles(theme).nameInputs]} />;
};

export const FormDescription = (props: any) => {
  const theme = useTheme();
  return <Text {...props} style={[props.style, createSharedStyles(theme).formDescription]} />;
};
