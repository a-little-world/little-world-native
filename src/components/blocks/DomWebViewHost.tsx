import React, { useEffect } from 'react';
import LittleWorldWebLazy from './LittleWorldWebLazy';
import { useDomCommunicationContext } from './DomCommunicationCore';

export default function DomWebViewHost() {
  const { domRef, onDomMessage, sendToReactNative, getAccessJwtToken, getRefreshJwtToken, sendToDom } = useDomCommunicationContext();

  useEffect(() => {
    let cancelled = false;
    const syncToken = async () => {
      const access = await getAccessJwtToken();
      const refresh = await getRefreshJwtToken();
      if (!cancelled && access) {
        await sendToDom('setAuthToken', { accessToken: access, refreshToken: refresh || undefined });
      }
    };
    void syncToken();
    return () => { cancelled = true; };
  }, [getAccessJwtToken, getRefreshJwtToken, sendToDom]);

  return (
    <LittleWorldWebLazy
      ref={domRef}
      onMessage={onDomMessage}
      sendToReactNative={sendToReactNative}
    />
  );
}


