import React, { createContext, useContext, useCallback, useRef, useState, ReactNode, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, Clipboard, ScrollView, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LittleWorldWebLazy, {
  type DomAPI, type DomResponse
} from './LittleWorldWebLazy';
import { useDomCommunication } from '@/src/hooks/useDomCommunication';

// Configuration flag to control debug UI visibility
const SHOW_DEBUG_UI = true; // Set to false to hide debug controls

// Token storage using expo-secure-store on mobile, with enhanced fallbacks
const TOKEN_STORAGE_KEY = 'dom_auth_token';
const TOKEN_TIMESTAMP_KEY = 'dom_auth_token_timestamp';

// Enhanced in-memory storage with web localStorage fallback
const enhancedStorage = {
  token: '',
  timestamp: '',
  
  setToken: (token: string) => {
    enhancedStorage.token = token;
    enhancedStorage.timestamp = new Date().toISOString();
    
    // Try to persist to localStorage if available (for web compatibility)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_TIMESTAMP_KEY, enhancedStorage.timestamp);
        console.log('💾 Token saved to enhanced storage (localStorage + memory)');
      } else {
        console.log('💾 Token saved to in-memory storage');
      }
    } catch (error) {
      console.log('💾 Token saved to in-memory storage (localStorage failed)');
    }
  },
  
  getToken: () => {
    // If we have a token in memory, return it
    if (enhancedStorage.token) {
      return enhancedStorage.token;
    }
    
    // Try to load from localStorage if available
    try {
      if (typeof localStorage !== 'undefined') {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          enhancedStorage.token = storedToken;
          enhancedStorage.timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY) || new Date().toISOString();
          console.log('💾 Token loaded from localStorage');
          return storedToken;
        }
      }
    } catch (error) {
      console.log('⚠️ Failed to load from localStorage:', error);
    }
    
    return enhancedStorage.token;
  },
  
  getTimestamp: () => {
    // If we have a timestamp in memory, return it
    if (enhancedStorage.timestamp) {
      return enhancedStorage.timestamp;
    }
    
    // Try to load from localStorage if available
    try {
      if (typeof localStorage !== 'undefined') {
        const storedTimestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
        if (storedTimestamp) {
          enhancedStorage.timestamp = storedTimestamp;
          return storedTimestamp;
        }
      }
    } catch (error) {
      console.log('⚠️ Failed to load timestamp from localStorage:', error);
    }
    
    return enhancedStorage.timestamp;
  },
  
  clearToken: () => {
    enhancedStorage.token = '';
    enhancedStorage.timestamp = '';
    
    // Try to clear from localStorage if available
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
        console.log('💾 Token cleared from enhanced storage');
      } else {
        console.log('💾 Token cleared from in-memory storage');
      }
    } catch (error) {
      console.log('💾 Token cleared from in-memory storage (localStorage failed)');
    }
  }
};

// Primary storage using expo-secure-store on mobile platforms
const secureStorage = {
  setToken: async (token: string) => {
    try {
      console.log('🔐 Attempting to save token to SecureStore...');
      
      // Check if SecureStore is available and functional
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        console.log('✅ SecureStore methods are available');
        
        // Save token using SecureStore
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
        await SecureStore.setItemAsync(TOKEN_TIMESTAMP_KEY, new Date().toISOString());
        console.log('✅ Token saved to SecureStore successfully');
        return;
      } else {
        console.log('⚠️ SecureStore methods not available');
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, falling back to enhanced storage:', String(error));
      // Fallback to enhanced storage
      enhancedStorage.setToken(token);
    }
  },
  
  getToken: async (): Promise<string | null> => {
    try {
      console.log('🔐 Attempting to get token from SecureStore...');
      
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        console.log('✅ SecureStore methods are available');
        
        // Get token using SecureStore
        const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
        console.log('🔍 Token retrieved from SecureStore:', token ? 'found' : 'not found');
        return token;
      } else {
        console.log('⚠️ SecureStore methods not available');
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, using enhanced storage:', String(error));
      // Fallback to enhanced storage
      return enhancedStorage.getToken();
    }
  },
  
  getTimestamp: async (): Promise<string | null> => {
    try {
      console.log('🔐 Attempting to get timestamp from SecureStore...');
      
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        console.log('✅ SecureStore methods are available');
        
        // Get timestamp using SecureStore
        const timestamp = await SecureStore.getItemAsync(TOKEN_TIMESTAMP_KEY);
        console.log('🔍 Timestamp retrieved from SecureStore:', timestamp ? 'found' : 'not found');
        return timestamp;
      } else {
        console.log('⚠️ SecureStore methods not available');
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, using enhanced storage:', String(error));
      // Fallback to enhanced storage
      return enhancedStorage.getTimestamp();
    }
  },
  
  clearToken: async () => {
    try {
      console.log('🔐 Attempting to clear token from SecureStore...');
      
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        console.log('✅ SecureStore methods are available');
        
        // Clear token using SecureStore
        await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(TOKEN_TIMESTAMP_KEY);
        console.log('✅ Token cleared from SecureStore successfully');
        return;
      } else {
        console.log('⚠️ SecureStore methods not available');
        throw new Error('SecureStore methods not available');
      }
    } catch (error) {
      console.warn('⚠️ SecureStore failed, clearing enhanced storage:', String(error));
      // Fallback to enhanced storage
      enhancedStorage.clearToken();
    }
  }
};

// Main storage interface that chooses the best available method
const tokenStorage = {
  setToken: async (token: string) => {
    // On mobile platforms, try SecureStore first
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await secureStorage.setToken(token);
    } else {
      // On web, use enhanced storage directly
      enhancedStorage.setToken(token);
    }
  },
  
  getToken: async (): Promise<string | null> => {
    // On mobile platforms, try SecureStore first
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return await secureStorage.getToken();
    } else {
      // On web, use enhanced storage directly
      return enhancedStorage.getToken();
    }
  },
  
  getTimestamp: async (): Promise<string | null> => {
    // On mobile platforms, try SecureStore first
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return await secureStorage.getTimestamp();
    } else {
      // On web, use enhanced storage directly
      return enhancedStorage.getTimestamp();
    }
  },
  
  clearToken: async () => {
    // On mobile platforms, try SecureStore first
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await secureStorage.clearToken();
    } else {
      // On web, use enhanced storage directly
      enhancedStorage.clearToken();
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

  async function setDomToken(token: string) {
    const response = await sendToDom(domRef, 'setAuthToken', {
      token,
    });
    if (!response.ok) {
      setTimeout(() => {
        setDomToken(token);
      }, 100);
    } else {
      console.log('successfully sent token to dom');
    }
  }

  useEffect(() => {
    console.log(`token ${!storedToken ? 'not' : ''} stored`);
    if (storedToken) {
      setDomToken(storedToken);
    }
  }, [storedToken]);

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
      console.log('🔍 Platform:', Platform.OS);
      console.log('🔍 Development mode:', __DEV__);
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // On mobile, check if SecureStore is available and functional
        try {
          // Check if SecureStore has the expected methods
          if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
            console.log('✅ SecureStore methods are available');
            
            // Test if SecureStore is actually functional by trying a simple operation
            try {
              console.log('🧪 Testing SecureStore functionality...');
              const testKey = '__test_securestore_' + Date.now();
              const testValue = 'test_value_' + Date.now();
              
              // Try to save a test value
              await SecureStore.setItemAsync(testKey, testValue);
              console.log('✅ SecureStore setItemAsync test passed');
              
              // Try to retrieve the test value
              const retrievedValue = await SecureStore.getItemAsync(testKey);
              console.log('✅ SecureStore getItemAsync test passed');
              
              // Try to delete the test value
              await SecureStore.deleteItemAsync(testKey);
              console.log('✅ SecureStore deleteItemAsync test passed');
              
              // Verify the value was actually stored and retrieved
              if (retrievedValue === testValue) {
                console.log('✅ SecureStore is fully functional on mobile');
                setStorageMethod('SecureStore (Mobile)');
                return;
              } else {
                throw new Error('SecureStore test value mismatch');
              }
            } catch (testError) {
              console.log('⚠️ SecureStore functionality test failed:', String(testError));
              console.log('⚠️ SecureStore module loaded but native functionality not working');
              setStorageMethod('Enhanced Storage (SecureStore not functional)');
              return;
            }
          } else {
            console.log('⚠️ SecureStore methods not available');
            setStorageMethod('Enhanced Storage (SecureStore incomplete)');
            return;
          }
        } catch (error) {
          console.log('⚠️ SecureStore check failed, using enhanced fallback:', String(error));
          
          // Check if this is a development environment issue
          if (__DEV__) {
            console.log('⚠️ This might be a development build issue - SecureStore needs proper native linking');
            setStorageMethod('Enhanced Storage (Dev Build - SecureStore not linked)');
          } else {
            setStorageMethod('Enhanced Storage (SecureStore unavailable)');
          }
          return;
        }
      } else {
        // On web, use enhanced storage
        if (typeof localStorage !== 'undefined') {
          console.log('✅ localStorage available on web');
          setStorageMethod('Enhanced Storage (Web)');
        } else {
          console.log('⚠️ localStorage not available, using in-memory only');
          setStorageMethod('In-Memory Only');
        }
      }
    } catch (error) {
      console.log('⚠️ Error checking storage method, using enhanced storage:', error);
      setStorageMethod('Enhanced Storage (Error)');
    }
  };

  // New function to save token received from DOM
  const saveTokenFromDom = async (token: string, timestamp?: string) => {
    try {
      console.log('💾 Saving token received from DOM...');
      await tokenStorage.setToken(token);
      setStoredToken(token);
      setTokenInput(token);
      setTokenTimestamp(timestamp || new Date().toISOString());
      console.log('✅ Token from DOM saved successfully');
      
      // Show success message
      Alert.alert('Token Updated', 'Token received from DOM component and saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save token from DOM:', error);
      Alert.alert('Error', 'Failed to save token received from DOM component.');
    }
  };

  // Test token storage persistence
  const testTokenStorage = async () => {
    try {
      console.log('🧪 Testing token storage persistence...');
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Test SecureStore first on mobile
        try {
          console.log('🔐 Testing SecureStore functionality...');
          
          if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
            const testKey = '__test_securestore_' + Date.now();
            const testValue = 'test_value_' + Date.now();
            
            console.log('💾 Testing SecureStore setItemAsync...');
            await SecureStore.setItemAsync(testKey, testValue);
            console.log('✅ SecureStore setItemAsync test passed');
            
            console.log('🔍 Testing SecureStore getItemAsync...');
            const retrievedValue = await SecureStore.getItemAsync(testKey);
            console.log('✅ SecureStore getItemAsync test passed');
            
            console.log('🗑️ Testing SecureStore deleteItemAsync...');
            await SecureStore.deleteItemAsync(testKey);
            console.log('✅ SecureStore deleteItemAsync test passed');
            
            if (retrievedValue === testValue) {
              console.log('✅ SecureStore is fully functional!');
              Alert.alert('SecureStore Test', '✅ SecureStore is working correctly!');
            } else {
              throw new Error('SecureStore test value mismatch');
            }
            
            // Clean up test
            await SecureStore.deleteItemAsync(testKey);
            return;
          }
        } catch (secureStoreError) {
          console.log('⚠️ SecureStore test failed:', String(secureStoreError));
          console.log('🔄 Falling back to enhanced storage test...');
        }
      }
      
      // Test enhanced storage
      const testToken = `test_token_${Date.now()}`;
      
      // Save test token
      enhancedStorage.setToken(testToken);
      console.log('✅ Test token saved to enhanced storage');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to load it back
      const loadedToken = enhancedStorage.getToken();
      console.log('🔍 Test token loaded:', loadedToken === testToken ? '✅ MATCH' : '❌ MISMATCH');
      
      if (loadedToken === testToken) {
        Alert.alert('Enhanced Storage Test', '✅ Enhanced storage is working correctly!');
      } else {
        Alert.alert('Enhanced Storage Test', '❌ Enhanced storage is not persisting correctly.');
      }
      
      // Clean up test token
      enhancedStorage.clearToken();
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
        // Use the proper tokenStorage interface that chooses the best method
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
      // Get the current token from storage to ensure we have the latest
      const currentToken = await tokenStorage.getToken();
      
      if (currentToken) {
        const response = await sendToDom(domRef, 'setAuthToken', { token: currentToken });
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

  const displayTokenInfo = async () => {
    try {
      // Get current token and timestamp from storage to ensure we have the latest info
      const currentToken = await tokenStorage.getToken();
      const currentTimestamp = await tokenStorage.getTimestamp();
      
      const tokenInfo = {
        token: currentToken || storedToken,
        timestamp: currentTimestamp || tokenTimestamp,
        hasToken: !!currentToken,
        tokenLength: (currentToken || storedToken).length,
        tokenType: getTokenType(currentToken || storedToken),
        isValidFormat: (currentToken || storedToken).length > 0 && ((currentToken || storedToken).includes('.') || (currentToken || storedToken).length >= 32),
        storageType: storageMethod,
        lastUpdated: new Date().toISOString()
      };
      setLastResponse({ ok: true, data: tokenInfo });
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      setLastResponse({ ok: false, error: String(error) });
    }
  };

  const handleDomMessage = useCallback(async (action: string, payload?: object): Promise<DomResponse> => {
    return { ok: true };
  }, []);

  const sendToReactNative = useCallback((action: string, payload?: object) => {
    // Handle response from DOM component
    if (action === 'response') {
      handleDomResponse(action, payload);
    } else if (action === 'setTokenFromDom') {
      // Handle token setting from DOM component
      const { token, timestamp } = payload as { token: string; timestamp?: string };
      if (token) {
        saveTokenFromDom(token, timestamp);
      }
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
                  storageMethod.includes('SecureStore') ? styles.storageMethodSecure : styles.storageMethodFallback
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
              <Text style={styles.debugNote}>Note: Uses SecureStore on mobile (Android/iOS), enhanced storage on web</Text>
              
              {/* DOM Token Communication Info */}
              <View style={styles.domTokenInfo}>
                <Text style={styles.domTokenInfoTitle}>🔐 DOM Token Communication</Text>
                <Text style={styles.domTokenInfoText}>
                  DOM components can send tokens using the 'setTokenFromDom' action:
                </Text>
                <Text style={styles.domTokenCode}>
                  {`sendToReactNative('setTokenFromDom', {
  token: 'your_jwt_token_here',
  timestamp: '2024-01-01T00:00:00.000Z'
})`}
                </Text>
                <Text style={styles.domTokenInfoText}>
                  This will automatically save the token to secure storage.
                </Text>
                <TouchableOpacity
                  style={styles.testDomTokenButton}
                  onPress={() => {
                    // Simulate receiving a token from DOM
                    const testToken = `test_dom_token_${Date.now()}`;
                    const testTimestamp = new Date().toISOString();
                    saveTokenFromDom(testToken, testTimestamp);
                  }}
                >
                  <Text style={styles.testDomTokenButtonText}>🧪 Test DOM Token</Text>
                </TouchableOpacity>
              </View>
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
                      onPress={() => displayTokenInfo()}
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
  domTokenInfo: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  domTokenInfoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 4,
  },
  domTokenInfoText: {
    fontSize: 10,
    color: '#1976d2',
    marginBottom: 4,
    lineHeight: 14,
  },
  domTokenCode: {
    fontSize: 9,
    color: '#0d47a1',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testDomTokenButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  testDomTokenButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
}); 