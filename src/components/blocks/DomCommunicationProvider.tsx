import React, { createContext, useContext, useCallback, useRef, useState, ReactNode } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LittleWorldWebLazy, {
  type DomAPI, type DomResponse
} from './LittleWorldWebLazy';
import { useDomCommunication } from '@/src/hooks/useDomCommunication';

// Configuration flag to control debug UI visibility
const SHOW_DEBUG_UI = true; // Set to false to hide debug controls

interface DomCommunicationContextType {
  sendToDom: (action: string, payload?: object) => Promise<DomResponse>;
  domRef: React.RefObject<DomAPI>;
}

const DomCommunicationContext = createContext<DomCommunicationContextType | null>(null);

export function useDomCommunicationContext() {
  const context = useContext(DomCommunicationContext);
  if (!context) {
    throw new Error('useDomCommunicationContext must be used within a DomCommunicationProvider');
  }
  return context;
}

interface DomCommunicationProviderProps {
  children: ReactNode;
}

export function DomCommunicationProvider({ children }: DomCommunicationProviderProps) {
  const domRef = useRef<DomAPI>(null);
  const { handleDomResponse, sendToDom } = useDomCommunication();
  const [inputMessage, setInputMessage] = useState<string>('Hello from React Native');
  const [lastResponse, setLastResponse] = useState<DomResponse | null>(null);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('/sign-up');
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);

  const routes = [
    { label: 'Sign Up', value: '/sign-up' },
    { label: 'Login', value: '/login' },
    { label: 'Profile', value: '/profile' },
    { label: 'Settings', value: '/settings' },
    { label: 'Help', value: '/help' },
  ];

  const handleDomMessage = useCallback(async (action: string, payload?: object): Promise<DomResponse> => {
    return { ok: true };
  }, []);

  const sendToReactNative = useCallback((action: string, payload?: object) => {
    // Handle response from DOM component
    if (action === 'response') {
      handleDomResponse(action, payload);
    }
  }, [handleDomResponse]);

  const handlePingDom = useCallback(async () => {
    try {
      const response = await sendToDom(domRef, 'PING', { message: inputMessage });
      setLastResponse(response);
    } catch (error) {
      const fallback: DomResponse = { ok: false, error: String(error) };
      setLastResponse(fallback);
    }
  }, [sendToDom, inputMessage]);

  const contextValue: DomCommunicationContextType = {
    sendToDom: (action: string, payload?: object) => sendToDom(domRef, action, payload),
    domRef
  };

  return (
    <DomCommunicationContext.Provider value={contextValue}>
      {children}
      
      {/* Toggle Button */}
      {SHOW_DEBUG_UI && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsDebugVisible(!isDebugVisible)}
        >
          <Text style={styles.toggleButtonText}>🐛</Text>
        </TouchableOpacity>
      )}

      {/* Debug Overlay */}
      {SHOW_DEBUG_UI && isDebugVisible && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>DOM Debug Panel</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDebugVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputRow}>
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Message to send to DOM"
              style={styles.textInput}
            />
            <TouchableOpacity
              style={styles.pingButton}
              onPress={handlePingDom}
            >
              <Text style={styles.pingButtonText}>Ping</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.navigationSection}>
            <Text style={styles.sectionLabel}>Navigation:</Text>
            <View style={styles.routeSelector}>
              <TouchableOpacity
                style={styles.routeDropdown}
                onPress={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
              >
                <Text style={styles.routeDropdownText}>
                  {routes.find(r => r.value === selectedRoute)?.label || 'Select Route'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={async () => {
                  await sendToDom(domRef, 'navigate', { path: selectedRoute });
                }}
              >
                <Text style={styles.navigateButtonText}>Go</Text>
              </TouchableOpacity>
            </View>
            
            {isRouteDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {routes.map((route) => (
                  <TouchableOpacity
                    key={route.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedRoute(route.value);
                      setIsRouteDropdownOpen(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      route.value === selectedRoute && styles.dropdownItemTextSelected
                    ]}>
                      {route.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Last Response:</Text>
            <Text style={styles.responseText}>
              {lastResponse ? JSON.stringify(lastResponse, null, 2) : 'None'}
            </Text>
          </View>
        </View>
      )}
      
      <LittleWorldWebLazy 
        ref={domRef}
        onMessage={handleDomMessage} 
        sendToReactNative={sendToReactNative}
      />
    </DomCommunicationContext.Provider>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  toggleButtonText: {
    fontSize: 20,
    color: 'white',
  },
  debugOverlay: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxWidth: 320,
    maxHeight: 500,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  pingButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  pingButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  navigationSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  routeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  routeDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  navigateButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  responseContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 11,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
}); 