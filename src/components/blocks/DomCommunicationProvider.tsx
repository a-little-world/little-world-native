import React, { createContext, useContext, useCallback, useRef, useState, ReactNode, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, Clipboard, ScrollView } from 'react-native';
import LittleWorldWebLazy, {
  type DomAPI, type DomResponse
} from './LittleWorldWebLazy';
import { useDomCommunication } from '@/src/hooks/useDomCommunication';

// Configuration flag to control debug UI visibility
const SHOW_DEBUG_UI = true; // Set to false to hide debug controls

// Token storage with fallback to in-memory when SecureStore is not available
const TOKEN_STORAGE_KEY = 'dom_auth_token';
const TOKEN_TIMESTAMP_KEY = 'dom_auth_token_timestamp';

// Fallback in-memory storage
const fallbackStorage = {
  token: '',
  timestamp: '',
  setToken: (token: string) => {
    fallbackStorage.token = token;
    fallbackStorage.timestamp = new Date().toLocaleString();
  },
  getToken: () => fallbackStorage.token,
  getTimestamp: () => fallbackStorage.timestamp,
  clearToken: () => {
    fallbackStorage.token = '';
    fallbackStorage.timestamp = '';
  }
};

// Check if we're in a development environment where SecureStore might not be available
const isSecureStoreAvailable = () => {
  try {
    // Check if we're in Expo Go or similar environment
    if (__DEV__) {
      // In development, be more cautious about SecureStore availability
      // Check if we're running in Expo Go or similar
      const isExpoGo = typeof global !== 'undefined' && (global as any).ExpoGo;
      const isDevelopmentBuild = typeof global !== 'undefined' && (global as any).__EXPO_ENV__ === 'development';
      
      if (isExpoGo || isDevelopmentBuild) {
        console.log('🔍 Detected Expo Go or development build - SecureStore may not be available');
        return false;
      }
      
      // For other development environments, we can try SecureStore
      return true;
    }
    
    // In production, SecureStore should be available
    return true;
  } catch (error) {
    console.log('⚠️ Error checking SecureStore availability:', error);
    return false;
  }
};

const tokenStorage = {
  setToken: async (token: string) => {
    if (!isSecureStoreAvailable()) {
      console.log('💾 Using fallback in-memory storage (SecureStore not available)');
      fallbackStorage.setToken(token);
      return;
    }

    try {
      console.log('🔐 Attempting to save token to SecureStore...');
      // Only try to import SecureStore if we think it's available
      const SecureStore = await import('expo-secure-store');
      console.log('✅ SecureStore module loaded successfully');
      console.log('🔍 SecureStore module structure:', Object.keys(SecureStore));
      console.log('🔍 SecureStore.default:', SecureStore.default);
      console.log('🔍 SecureStore.default type:', typeof SecureStore.default);
      if (SecureStore.default) {
        console.log('🔍 SecureStore.default keys:', Object.keys(SecureStore.default));
      }
      
      // Check if it's a default export or named export
      const secureStore = SecureStore.default || SecureStore;
      console.log('🔍 Final secureStore object:', secureStore);
      console.log('🔍 secureStore type:', typeof secureStore);
      if (secureStore) {
        console.log('🔍 secureStore keys:', Object.keys(secureStore));
      }
      
      // Try multiple ways to access SecureStore
      let workingSecureStore = null;
      
      // Test if the module is actually functional
      console.log('🧪 Testing SecureStore module functionality...');
      try {
        // Try to call a simple method to see if it's actually working
        if (SecureStore.default && typeof SecureStore.default.isAvailableAsync === 'function') {
          const isAvailable = await SecureStore.default.isAvailableAsync();
          console.log('🔍 SecureStore.isAvailableAsync result:', isAvailable);
        }
      } catch (testError) {
        console.log('⚠️ SecureStore test call failed:', testError);
      }
      
      // Method 1: Try SecureStore.default
      if (SecureStore.default && typeof SecureStore.default.setItemAsync === 'function') {
        workingSecureStore = SecureStore.default;
        console.log('✅ Found working SecureStore via SecureStore.default');
      }
      // Method 2: Try SecureStore directly
      else if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        workingSecureStore = SecureStore;
        console.log('✅ Found working SecureStore via SecureStore directly');
      }
      // Method 3: Try the fallback object
      else if (secureStore && typeof secureStore.setItemAsync === 'function') {
        workingSecureStore = secureStore;
        console.log('✅ Found working SecureStore via fallback object');
      }
      
      if (workingSecureStore) {
        await workingSecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
        await workingSecureStore.setItemAsync(TOKEN_TIMESTAMP_KEY, new Date().toISOString());
        console.log('✅ Token saved to SecureStore successfully');
      } else {
        console.log('❌ No working SecureStore found');
        console.log('❌ SecureStore.default methods:', SecureStore.default ? Object.keys(SecureStore.default) : 'null');
        console.log('❌ SecureStore methods:', SecureStore ? Object.keys(SecureStore) : 'null');
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, falling back to in-memory storage:', error);
      // Fallback to in-memory storage
      fallbackStorage.setToken(token);
      console.log('💾 Token saved to fallback in-memory storage');
    }
  },
  getToken: async (): Promise<string | null> => {
    if (!isSecureStoreAvailable()) {
      console.log('💾 Using fallback in-memory storage (SecureStore not available)');
      return fallbackStorage.getToken() || null;
    }

    try {
      console.log('🔐 Attempting to get token from SecureStore...');
      // Only try to import SecureStore if we think it's available
      const SecureStore = await import('expo-secure-store');
      console.log('✅ SecureStore module loaded successfully');
      
      // Check if it's a default export or named export
      const secureStore = SecureStore.default || SecureStore;
      if (secureStore && typeof secureStore.getItemAsync === 'function') {
        const token = await secureStore.getItemAsync(TOKEN_STORAGE_KEY);
        console.log('🔍 Token retrieved from SecureStore:', token ? 'found' : 'not found');
        return token;
      } else {
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, using in-memory storage:', error);
      // Fallback to in-memory storage
      const fallbackToken = fallbackStorage.getToken();
      console.log('💾 Token retrieved from fallback storage:', fallbackToken ? 'found' : 'not found');
      return fallbackToken || null;
    }
  },
  getTimestamp: async (): Promise<string | null> => {
    if (!isSecureStoreAvailable()) {
      console.log('💾 Using fallback in-memory storage (SecureStore not available)');
      return fallbackStorage.getTimestamp() || null;
    }

    try {
      console.log('🔐 Attempting to get timestamp from SecureStore...');
      // Only try to import SecureStore if we think it's available
      const SecureStore = await import('expo-secure-store');
      console.log('✅ SecureStore module loaded successfully');
      
      // Check if it's a default export or named export
      const secureStore = SecureStore.default || SecureStore;
      if (secureStore && typeof secureStore.getItemAsync === 'function') {
        const timestamp = await secureStore.getItemAsync(TOKEN_TIMESTAMP_KEY);
        console.log('🔍 Timestamp retrieved from SecureStore:', timestamp ? 'found' : 'not found');
        return timestamp;
      } else {
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, using in-memory storage:', error);
      // Fallback to in-memory storage
      const fallbackTimestamp = fallbackStorage.getTimestamp();
      console.log('💾 Timestamp retrieved from fallback storage:', fallbackTimestamp ? 'found' : 'not found');
      return fallbackTimestamp || null;
    }
  },
  clearToken: async () => {
    if (!isSecureStoreAvailable()) {
      console.log('💾 Using fallback in-memory storage (SecureStore not available)');
      fallbackStorage.clearToken();
      return;
    }

    try {
      console.log('🔐 Attempting to clear token from SecureStore...');
      // Only try to import SecureStore if we think it's available
      const SecureStore = await import('expo-secure-store');
      console.log('✅ SecureStore module loaded successfully');
      
      // Check if it's a default export or named export
      const secureStore = SecureStore.default || SecureStore;
      if (secureStore && typeof secureStore.deleteItemAsync === 'function') {
        await secureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        await secureStore.deleteItemAsync(TOKEN_TIMESTAMP_KEY);
        console.log('✅ Token cleared from SecureStore successfully');
      } else {
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, clearing in-memory storage:', error);
      // Fallback to in-memory storage
      fallbackStorage.clearToken();
      console.log('💾 Token cleared from fallback storage');
    }
  }
};

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
  const [storedToken, setStoredToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [tokenTimestamp, setTokenTimestamp] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [storageMethod, setStorageMethod] = useState<string>('Unknown');

  const routes = [
    { label: 'Sign Up', value: '/sign-up' },
    { label: 'Login', value: '/login' },
    { label: 'Profile', value: '/profile' },
    { label: 'Settings', value: '/settings' },
    { label: 'Help', value: '/help' },
  ];

  // Load stored token on component mount
  useEffect(() => {
    loadStoredToken();
    checkStorageMethod();
  }, []);

  // Update current time every second when debug panel is visible
  useEffect(() => {
    if (!isDebugVisible) return;
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [isDebugVisible]);

  // Check what storage method is available
  const checkStorageMethod = async () => {
    try {
      console.log('🔍 Checking available storage method...');
      if (isSecureStoreAvailable()) {
        console.log('✅ SecureStore should be available');
        setStorageMethod('SecureStore');
      } else {
        console.log('⚠️ SecureStore not available, using fallback');
        setStorageMethod('In-Memory (Fallback)');
      }
    } catch (error) {
      console.log('⚠️ Error checking storage method, using fallback:', error);
      setStorageMethod('In-Memory (Fallback)');
    }
  };

  // Test token storage persistence
  const testTokenStorage = async () => {
    try {
      console.log('🧪 Testing token storage persistence...');
      const testToken = `test_token_${Date.now()}`;
      
      // Save test token
      await tokenStorage.setToken(testToken);
      console.log('✅ Test token saved');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to load it back
      const loadedToken = await tokenStorage.getToken();
      console.log('🔍 Test token loaded:', loadedToken === testToken ? '✅ MATCH' : '❌ MISMATCH');
      
      if (loadedToken === testToken) {
        Alert.alert('Test Result', '✅ Token storage is working correctly!');
      } else {
        Alert.alert('Test Result', '❌ Token storage is not persisting correctly.');
      }
      
      // Clean up test token
      await tokenStorage.clearToken();
      console.log('🧹 Test token cleaned up');
      
    } catch (error) {
      console.error('❌ Token storage test failed:', error);
      Alert.alert('Test Failed', `Error: ${error}`);
    }
  };

  const loadStoredToken = async () => {
    try {
      console.log('🔍 Loading stored token...');
      const token = await tokenStorage.getToken();
      const timestamp = await tokenStorage.getTimestamp();
      console.log('🔍 Token loaded:', { token: token ? `${token.substring(0, 10)}...` : 'null', timestamp });
      
      if (token) {
        setStoredToken(token);
        setTokenInput(token);
        setTokenTimestamp(timestamp || '');
        console.log('✅ Token successfully loaded and set in state');
      } else {
        console.log('⚠️ No token found in storage');
      }
    } catch (error) {
      console.error('❌ Failed to load stored token:', error);
    }
  };

  const saveToken = async () => {
    try {
      if (tokenInput.trim()) {
        console.log('💾 Saving token...');
        await tokenStorage.setToken(tokenInput.trim());
        setStoredToken(tokenInput.trim());
        const timestamp = await tokenStorage.getTimestamp();
        setTokenTimestamp(timestamp || '');
        console.log('✅ Token saved successfully');
        Alert.alert('Success', 'Token saved!');
      } else {
        Alert.alert('Error', 'Please enter a token to save.');
      }
    } catch (error) {
      console.error('❌ Failed to save token:', error);
      Alert.alert('Error', 'Failed to save token. Please try again.');
    }
  };

  const clearToken = async () => {
    try {
      console.log('🗑️ Clearing token...');
      await tokenStorage.clearToken();
      setStoredToken('');
      setTokenInput('');
      setTokenTimestamp('');
      console.log('✅ Token cleared successfully');
      Alert.alert('Success', 'Token cleared successfully!');
    } catch (error) {
      console.error('❌ Failed to clear token:', error);
      Alert.alert('Error', 'Failed to clear token. Please try again.');
    }
  };

  const copyTokenToClipboard = async () => {
    try {
      await Clipboard.setString(storedToken);
      Alert.alert('Success', 'Token copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy token to clipboard:', error);
      Alert.alert('Error', 'Failed to copy token to clipboard.');
    }
  };

  const sendTokenToDom = async () => {
    try {
      if (storedToken) {
        const response = await sendToDom(domRef, 'setAuthToken', { token: storedToken });
        setLastResponse(response);
        Alert.alert('Success', 'Token sent to DOM component!');
      } else {
        Alert.alert('Error', 'No token stored to send.');
      }
    } catch (error) {
      const fallback: DomResponse = { ok: false, error: String(error) };
      setLastResponse(fallback);
      Alert.alert('Error', 'Failed to send token to DOM component.');
    }
  };

  const getTokenType = (token: string): string => {
    if (token.startsWith('Bearer ')) return 'Bearer';
    if (token.startsWith('Basic ')) return 'Basic';
    if (token.includes('.') && token.split('.').length === 3) return 'JWT';
    if (token.length >= 32) return 'Long Token';
    return 'Unknown';
  };

  const formatResponse = (response: DomResponse): string => {
    try {
      return JSON.stringify(response, null, 2);
    } catch (error) {
      return `Error formatting response: ${error}`;
    }
  };

  const displayTokenInfo = () => {
    const tokenInfo = {
      token: storedToken,
      timestamp: tokenTimestamp,
      hasToken: !!storedToken,
      tokenLength: storedToken.length,
      tokenType: getTokenType(storedToken),
      isValidFormat: storedToken.length > 0 && (storedToken.includes('.') || storedToken.length >= 32),
      storageType: 'Secure Store (with fallback)',
      lastUpdated: new Date().toISOString()
    };
    setLastResponse({ ok: true, data: tokenInfo });
  };

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
            <View>
              <Text style={styles.debugTitle}>DOM Debug Panel</Text>
              {currentTime && (
                <Text style={styles.currentTime}>{currentTime}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDebugVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.debugContent} showsVerticalScrollIndicator={false}>
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
              <View style={styles.currentRouteDisplay}>
                <Text style={styles.currentRouteLabel}>Current Route:</Text>
                <Text style={styles.currentRouteValue}>{selectedRoute}</Text>
              </View>
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

            <View style={styles.tokenSection}>
              <Text style={styles.sectionLabel}>Token Storage:</Text>
              <View style={styles.storageMethodInfo}>
                <Text style={styles.storageMethodLabel}>Storage Method:</Text>
                <Text style={[
                  styles.storageMethodValue,
                  storageMethod === 'SecureStore' ? styles.storageMethodSecure : styles.storageMethodFallback
                ]}>
                  {storageMethod}
                </Text>
                <TouchableOpacity
                  style={styles.testStorageButton}
                  onPress={checkStorageMethod}
                >
                  <Text style={styles.testStorageButtonText}>Test</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.testPersistenceButton}
                  onPress={testTokenStorage}
                >
                  <Text style={styles.testPersistenceButtonText}>Test Persistence</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.debugNote}>Note: Uses SecureStore when available, falls back to in-memory storage</Text>
              <View style={styles.tokenInputRow}>
                <TextInput
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  placeholder={storedToken ? "Edit stored token..." : "Enter token to store..."}
                  style={[
                    styles.tokenTextInput,
                    tokenInput !== storedToken && tokenInput.trim() && styles.tokenTextInputModified
                  ]}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity
                  style={[
                    styles.saveTokenButton,
                    tokenInput !== storedToken && tokenInput.trim() ? styles.saveTokenButtonActive : styles.saveTokenButtonInactive
                  ]}
                  onPress={saveToken}
                  disabled={!tokenInput.trim() || tokenInput === storedToken}
                >
                  <Text style={[
                    styles.saveTokenButtonText,
                    tokenInput !== storedToken && tokenInput.trim() ? styles.saveTokenButtonTextActive : styles.saveTokenButtonTextInactive
                  ]}>
                    {tokenInput === storedToken ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tokenInputInfo}>
                <Text style={styles.characterCount}>
                  {tokenInput.length} characters
                </Text>
                {tokenInput.length > 1000 && (
                  <Text style={styles.characterLimitWarning}>
                    ⚠ Very long token
                  </Text>
                )}
                {tokenInput !== storedToken && tokenInput.trim() && (
                  <Text style={styles.unsavedChanges}>* Unsaved changes</Text>
                )}
              </View>
              {storedToken ? (
                <View style={styles.storedTokenContainer}>
                  <View style={styles.tokenHeader}>
                    <Text style={styles.storedTokenLabel}>Stored Token:</Text>
                    <View style={styles.tokenStatus}>
                      <Text style={styles.tokenTypeText}>
                        {getTokenType(storedToken)}
                      </Text>
                      <Text style={[
                        styles.tokenStatusText,
                        (storedToken.includes('.') || storedToken.length >= 32) ? styles.tokenStatusValid : styles.tokenStatusInvalid
                      ]}>
                        {(storedToken.includes('.') || storedToken.length >= 32) ? '✓ Valid' : '⚠ Invalid'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.storedTokenText} numberOfLines={2}>
                    {storedToken}
                  </Text>
                  {tokenTimestamp && (
                    <Text style={styles.tokenTimestamp}>
                      Saved: {tokenTimestamp}
                    </Text>
                  )}
                  <View style={styles.tokenActionButtons}>
                    <TouchableOpacity
                      style={styles.copyTokenButton}
                      onPress={copyTokenToClipboard}
                    >
                      <Text style={styles.copyTokenButtonText}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendTokenButton}
                      onPress={sendTokenToDom}
                    >
                      <Text style={styles.sendTokenButtonText}>Send to DOM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.infoTokenButton}
                      onPress={displayTokenInfo}
                    >
                      <Text style={styles.infoTokenButtonText}>Info</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.clearTokenButton}
                      onPress={clearToken}
                    >
                      <Text style={styles.clearTokenButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.noTokenText}>No token stored</Text>
              )}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.responseContainer}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseLabel}>Last Response:</Text>
                <View style={styles.responseMeta}>
                  {lastResponse && (
                    <>
                      <Text style={styles.responseMetaText}>
                        {lastResponse.ok ? '✓ Success' : '✗ Error'}
                      </Text>
                      <Text style={styles.responseTimestamp}>
                        {new Date().toLocaleTimeString()}
                      </Text>
                    </>
                  )}
                  <TouchableOpacity
                    style={styles.clearResponseButton}
                    onPress={() => setLastResponse(null)}
                  >
                    <Text style={styles.clearResponseButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.responseText}>
                {lastResponse ? formatResponse(lastResponse) : 'None'}
              </Text>
            </View>
          </ScrollView>
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
    width: 400,
    maxHeight: 600,
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
  currentTime: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
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
  debugContent: {
    flex: 1,
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
  currentRouteDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  currentRouteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
    marginRight: 8,
  },
  currentRouteValue: {
    fontSize: 10,
    color: '#007AFF',
    fontFamily: 'monospace',
    fontWeight: '600',
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
  tokenSection: {
    marginBottom: 16,
  },
  debugNote: {
    fontSize: 10,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tokenInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tokenTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
    minHeight: 40,
  },
  tokenTextInputModified: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  saveTokenButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  saveTokenButtonActive: {
    backgroundColor: '#007AFF',
  },
  saveTokenButtonInactive: {
    backgroundColor: '#6c757d',
  },
  saveTokenButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveTokenButtonTextActive: {
    color: 'white',
  },
  saveTokenButtonTextInactive: {
    color: '#adb5bd',
  },
  tokenInputInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 10,
    color: '#6c757d',
  },
  characterLimitWarning: {
    fontSize: 10,
    color: '#fd7e14',
    fontStyle: 'italic',
  },
  unsavedChanges: {
    fontSize: 10,
    color: '#dc3545',
    fontStyle: 'italic',
  },
  storedTokenContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#c3e6c3',
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storedTokenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#155724',
  },
  tokenStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
  },
  tokenTypeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  tokenStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  tokenStatusValid: {
    color: '#155724',
  },
  tokenStatusInvalid: {
    color: '#721c24',
  },
  storedTokenText: {
    fontSize: 10,
    color: '#155724',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  tokenTimestamp: {
    fontSize: 9,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tokenActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  copyTokenButton: {
    backgroundColor: '#6f42c1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyTokenButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  sendTokenButton: {
    backgroundColor: '#fd7e14',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sendTokenButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  infoTokenButton: {
    backgroundColor: '#20c997',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  infoTokenButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  clearTokenButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearTokenButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  noTokenText: {
    fontSize: 11,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },

  responseContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  responseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseMetaText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#28a745',
  },
  responseTimestamp: {
    fontSize: 9,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  responseText: {
    fontSize: 11,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  clearResponseButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearResponseButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  storageMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  storageMethodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
  },
  storageMethodValue: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storageMethodSecure: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  storageMethodFallback: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  testStorageButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  testStorageButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  testPersistenceButton: {
    backgroundColor: '#6f42c1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  testPersistenceButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
}); 