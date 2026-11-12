import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Text,
} from '@a-little-world/little-world-design-system-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

export default function WebViewCrashScreen({
  onReload,
}: {
  onReload: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.surface.primary },
      ]}
    >
      <Card>
        <CardHeader>{t('crash_screen.title')}</CardHeader>
        <CardContent>
          <Text center>{t('crash_screen.text')}</Text>
        </CardContent>
        <CardFooter>
          <Button onPress={onReload}>
            <Text>{t('crash_screen.button')}</Text>
          </Button>
        </CardFooter>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
