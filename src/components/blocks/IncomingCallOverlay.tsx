import { useEffect, useRef } from 'react';
import { Image, View } from 'react-native';

import {
  ButtonAppearance,
  ButtonSizes,
  TextTypes,
} from '@a-little-world/little-world-design-system-core';
import {
  Button,
  Loading,
  LoadingSizes,
  CustomThemeProvider as NativeThemeProvider,
  Text,
} from '@a-little-world/little-world-design-system-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import { useIncomingCallStore } from '@/src/store/incomingCallStore';
import { useWebViewStore } from '@/src/store/webViewStore';
import { answerIncomingCall, declineIncomingCall } from '@/src/utils/callPush';

import { useDomCommunicationContext } from './DomCommunicationCore';
import { getIncomingCallOverlayStyles } from './IncomingCallOverlay.styles';

function IncomingCallOverlayContent() {
  const theme = useTheme();
  const styles = getIncomingCallOverlayStyles(theme);
  const { t } = useTranslation();
  const { sendToDom } = useDomCommunicationContext();

  const { call, status, clearIncomingCall, resetToRinging } =
    useIncomingCallStore();
  const webViewReady = useWebViewStore(state => state.ready);

  // The handover is a one-shot per call: re-sending it would re-open the call
  // setup the user may have already dismissed inside the WebView.
  const handedOverRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'connecting' || !call || !webViewReady) {
      return;
    }
    if (handedOverRoomRef.current === call.roomUuid) {
      return;
    }
    handedOverRoomRef.current = call.roomUuid;

    sendToDom({
      action: 'NATIVE_CALL_ACTION',
      payload: {
        action: 'answer',
        partnerId: call.partnerId,
        roomUuid: call.roomUuid,
      },
    })
      .then(response => {
        // sendToDom resolves (rather than rejects) with ok:false when the DOM
        // is not reachable, so the overlay must not close on that.
        if (!response.ok) {
          throw new Error(response.error);
        }
        clearIncomingCall(call.roomUuid);
      })
      .catch(error => {
        // Drop back to Accept/Decline rather than stranding the user on a
        // "connecting" screen with no buttons; pressing Accept retries.
        handedOverRoomRef.current = null;
        resetToRinging(call.roomUuid);
        console.warn('[call-push] handover to the WebView failed', error);
      });
  }, [status, call, webViewReady, sendToDom, clearIncomingCall, resetToRinging]);

  if (!call || !status) {
    return null;
  }

  const onDecline = () => {
    declineIncomingCall(call).then(rejected =>
      // Mirrors the web modal's reject so the call cannot re-open once the
      // WebView loads (blockIncomingCall + disconnectFromCall live there).
      sendToDom({
        action: 'NATIVE_CALL_ACTION',
        payload: {
          action: 'decline',
          partnerId: call.partnerId,
          roomUuid: call.roomUuid,
          rejected,
        },
      }).catch(() => {}),
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.caller}>
        {call.partnerImageUrl ? (
          <Image
            source={{ uri: call.partnerImageUrl }}
            style={styles.avatar}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text type={TextTypes.Heading4} center>
          {call.partnerName ?? t('call.incoming_call')}
        </Text>
        <Text type={TextTypes.Body4} center>
          {status === 'connecting'
            ? t('call.connecting')
            : t('call.incoming_call')}
        </Text>
        {status === 'connecting' && <Loading size={LoadingSizes.Medium} />}
      </View>

      {status === 'ringing' && (
        <View style={styles.actions}>
          <Button
            size={ButtonSizes.Stretch}
            appearance={ButtonAppearance.Primary}
            onPress={() => answerIncomingCall(call)}
          >
            {t('call.accept')}
          </Button>
          <Button
            size={ButtonSizes.Stretch}
            appearance={ButtonAppearance.Secondary}
            onPress={onDecline}
          >
            {t('call.decline')}
          </Button>
        </View>
      )}
    </View>
  );
}

export default function IncomingCallOverlay() {
  const status = useIncomingCallStore(state => state.status);
  if (!status) {
    return null;
  }

  return (
    <NativeThemeProvider>
      <IncomingCallOverlayContent />
    </NativeThemeProvider>
  );
}
