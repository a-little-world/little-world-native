import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  IncomingCall,
  useIncomingCallStore,
} from '@/src/store/incomingCallStore';
import {
  cancelIncomingCall,
  endLockScreenSession,
  RING_TIMEOUT_MS,
} from '@/src/utils/incomingCall';

type Props = {
  onAccept: (call: IncomingCall) => void;
  onDecline: (call: IncomingCall) => void;
};

function IncomingCallOverlay({ onAccept, onDecline }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const call = useIncomingCallStore(state => state.call);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [call?.sessionId]);

  // An unanswered ring self-dismisses its notification via `timeoutAfter`, but
  // nothing else tears down the overlay or lowers the lock-screen flag, which
  // would leave the app parked over the keyguard.
  // ponytail: the timer starts when the overlay mounts rather than when the ring
  // did, so a cold launch mid-ring over-waits. It is a backstop, not a contract -
  // the real fix is the server-side ring timeout.
  const sessionId = call?.sessionId;
  useEffect(() => {
    if (!sessionId) {
      return;
    }
    const timer = setTimeout(() => {
      cancelIncomingCall(sessionId).finally(endLockScreenSession);
    }, RING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [sessionId]);

  if (!call) {
    return null;
  }

  const showImage = !!call.callerImageUrl && !imageFailed;
  const initial = call.callerName.trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.overlay,
        { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 48 },
      ]}
    >
      <View style={styles.info}>
        {showImage ? (
          <Image
            source={{ uri: call.callerImageUrl }}
            style={styles.avatar}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{call.callerName}</Text>
        <Text style={styles.subtitle}>{t('incoming_call.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('incoming_call.decline')}
            onPress={() => onDecline(call)}
            style={[styles.button, styles.decline]}
          />
          <Text style={styles.buttonLabel}>{t('incoming_call.decline')}</Text>
        </View>
        <View style={styles.action}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('incoming_call.accept')}
            onPress={() => onAccept(call)}
            style={[styles.button, styles.accept]}
          />
          <Text style={styles.buttonLabel}>{t('incoming_call.accept')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  info: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2a2e37',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '600',
  },
  name: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: '#b9bec9',
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
  },
  action: {
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  decline: {
    backgroundColor: '#d13b3b',
  },
  accept: {
    backgroundColor: '#2fa84f',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 15,
  },
});

export default IncomingCallOverlay;
