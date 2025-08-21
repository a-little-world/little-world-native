import { useRef, useCallback } from 'react';
import { type DomResponse } from '@/src/components/blocks/LittleWorldWebLazy';

export interface DomRequest {
  action: string;
  payload?: object;
}

export interface DomCommunicationHook {
  handleDomResponse: (action: string, payload?: object) => void;
  sendToDom: (
    domRef: React.RefObject<{ receive(action: string, payload?: object): void }>,
    action: string, 
    payload?: object,
    timeoutMs?: number
  ) => Promise<DomResponse>;
}

/**
 * Custom hook for handling DOM component communication in Expo apps.
 * 
 * This hook provides a promise-based API for sending requests to DOM components
 * and receiving responses via callbacks, eliminating timing issues.
 * 
 * @returns {DomCommunicationHook} Object containing handleDomResponse and sendToDom functions
 * 
 * @example
 * ```tsx
 * const { handleDomResponse, sendToDom } = useDomCommunication();
 * 
 * // In your sendToReactNative callback:
 * const sendToReactNative = useCallback((action: string, payload?: object) => {
 *   if (action === 'response') {
 *     handleDomResponse(action, payload);
 *   }
 * }, [handleDomResponse]);
 * 
 * // To send a request to DOM:
 * const response = await sendToDom(domRef, 'PING', { message: 'Hello' });
 * ```
 */
export function useDomCommunication(): DomCommunicationHook {
  const pendingRequestsRef = useRef<Map<string, { resolve: (value: DomResponse) => void; reject: (reason: any) => void }>>(new Map());

  const handleDomResponse = useCallback((action: string, payload?: object) => {
    if (action === 'response') {
      const responsePayload = payload as { originalAction: string; originalPayload: object; response: DomResponse };
      
      // Find and resolve the pending request
      const requestKey = `${responsePayload.originalAction}_${JSON.stringify(responsePayload.originalPayload)}`;
      const pendingRequest = pendingRequestsRef.current.get(requestKey);
      
      if (pendingRequest) {
        pendingRequest.resolve(responsePayload.response);
        pendingRequestsRef.current.delete(requestKey);
      }
    }
  }, []);

  const sendToDom = useCallback(async (
    domRef: React.RefObject<{ receive(action: string, payload?: object): void }>,
    action: string, 
    payload?: object,
    timeoutMs: number = 5000
  ): Promise<DomResponse> => {
    if (!domRef.current) {
      return { ok: false, error: 'DOM not ready' };
    }
    
    try {
      // Create a promise that will be resolved when the response comes via callback
      const responsePromise = new Promise<DomResponse>((resolve, reject) => {
        const requestKey = `${action}_${JSON.stringify(payload)}`;
        
        // Store the promise resolvers
        pendingRequestsRef.current.set(requestKey, { resolve, reject });
        
        // Set a timeout to reject the promise if no response comes
        setTimeout(() => {
          if (pendingRequestsRef.current.has(requestKey)) {
            pendingRequestsRef.current.delete(requestKey);
            reject(new Error('Response timeout'));
          }
        }, timeoutMs);
      });
      
      // Send the request to DOM component (don't await the return value)
      domRef.current.receive(action, payload);
      
      // Wait for the response to come via the callback
      const response = await responsePromise;
      return response;
      
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }, []);

  return {
    handleDomResponse,
    sendToDom
  };
} 