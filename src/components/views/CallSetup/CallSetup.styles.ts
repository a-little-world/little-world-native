import { StyleSheet } from 'react-native';
import { DefaultTheme } from 'styled-components/native';

export const getCallSetupStyles = (theme: DefaultTheme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.color.surface.primary,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.large,
    },
    card: {
      position: 'relative',
      maxWidth: 500,
      alignSelf: 'flex-start',
      flex: 1,
      paddingTop: theme.spacing.large,
      paddingBottom: theme.spacing.large,
      paddingHorizontal: theme.spacing.large,
      gap: theme.spacing.xsmall,
      backgroundColor: theme.color.surface.primary,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing.small,
      top: theme.spacing.small,
      zIndex: 10,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    title: {
      textAlign: 'center',
      color: theme.color.text.highlight,
      marginBottom: theme.spacing.small,
      fontSize: 24,
      fontWeight: 'bold',
    },
    subtitle: {
      textAlign: 'center',
      color: theme.color.text.secondary,
      fontSize: 16,
      lineHeight: 24,
    },
    preJoinContainer: {
      width: '100%',
      marginVertical: theme.spacing.medium,
    },
    videoContainer: {
      width: '100%',
      height: 200,
      backgroundColor: theme.color.surface.secondary,
      borderRadius: 8,
      marginBottom: theme.spacing.medium,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    controlButton: {
      padding: theme.spacing.small,
      borderRadius: 25,
      backgroundColor: theme.color.surface.secondary,
      minWidth: 50,
      alignItems: 'center',
    },
    errorContainer: {
      backgroundColor: '#FFEBEE',
      borderColor: '#FFCDD2',
      borderWidth: 1,
      borderRadius: 8,
      padding: theme.spacing.small,
      marginTop: theme.spacing.small,
    },
    errorText: {
      color: '#D32F2F',
      textAlign: 'center',
      fontSize: 14,
    },
    deviceSelectContainer: {
      width: '100%',
      marginBottom: theme.spacing.small,
    },
    deviceSelectLabel: {
      color: theme.color.text.primary,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: theme.spacing.xxxsmall,
    },
    deviceSelect: {
      borderWidth: 1,
      borderColor: theme.color.border.subtle,
      borderRadius: 4,
      padding: theme.spacing.small,
      backgroundColor: theme.color.surface.primary,
      color: theme.color.text.primary,
    },
  });
}; 