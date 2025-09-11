import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useDomCommunicationContext } from './DomCommunicationCore';

export default function DomDebugPanel() {
  const { sendToDom, tokenStorage, getAccessJwtToken, getRefreshJwtToken } = useDomCommunicationContext();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Hello from React Native');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState('/sign-up');
  const [routeOpen, setRouteOpen] = useState(false);
  const [storedToken, setStoredToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenTimestamp, setTokenTimestamp] = useState('');
  const [now, setNow] = useState('');

  const routes = useMemo(() => [
    { label: 'Sign Up', value: '/sign-up' },
    { label: 'Login', value: '/login' },
    { label: 'Profile', value: '/profile' },
    { label: 'Settings', value: '/settings' },
    { label: 'Help', value: '/help' },
  ], []);

  useEffect(() => {
    const load = async () => {
      const token = await tokenStorage.getToken();
      const ts = await tokenStorage.getTimestamp();
      if (token) {
        setStoredToken(token);
        setTokenInput(token);
      }
      if (ts) setTokenTimestamp(ts);
    };
    void load();
  }, [tokenStorage]);

  useEffect(() => {
    if (!visible) return;
    const update = () => setNow(new Date().toLocaleTimeString());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [visible]);

  const ping = async () => {
    try {
      const res = await sendToDom('PING', { message });
      setLastResponse(res);
    } catch (e: any) {
      setLastResponse({ ok: false, error: String(e) });
    }
  };

  const saveToken = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Please enter a token to save.');
      return;
    }
    await tokenStorage.setToken(tokenInput.trim());
    setStoredToken(tokenInput.trim());
    const ts = await tokenStorage.getTimestamp();
    setTokenTimestamp(ts || '');
    Alert.alert('Success', 'Token saved!');
  };

  const clearToken = async () => {
    await tokenStorage.clearToken();
    setStoredToken('');
    setTokenInput('');
    setTokenTimestamp('');
    Alert.alert('Success', 'Token cleared successfully!');
  };

  const sendTokenToDom = async () => {
    const access = await getAccessJwtToken();
    const refresh = await getRefreshJwtToken();
    if (!access) {
      Alert.alert('Error', 'No token stored to send.');
      return;
    }
    const res = await sendToDom('setAuthToken', { accessToken: access, refreshToken: refresh || undefined });
    setLastResponse(res);
    Alert.alert('Success', 'Token sent to DOM component!');
  };

  const getTokenType = (token: string) => {
    if (token.startsWith('Bearer ')) return 'Bearer';
    if (token.startsWith('Basic ')) return 'Basic';
    if (token.includes('.') && token.split('.').length === 3) return 'JWT';
    if (token.length >= 32) return 'Long Token';
    return 'Unknown';
  };

  const format = (value: any) => {
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  };

  return (
    <>
      <TouchableOpacity style={styles.toggleButton} onPress={() => setVisible(!visible)}>
        <Text style={styles.toggleButtonText}>🐛</Text>
      </TouchableOpacity>
      {visible && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugHeader}>
            <View>
              <Text style={styles.debugTitle}>DOM Debug Panel</Text>
              {now ? <Text style={styles.currentTime}>{now}</Text> : null}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.debugContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputRow}>
              <TextInput value={message} onChangeText={setMessage} placeholder="Message to send to DOM" style={styles.textInput} />
              <TouchableOpacity style={styles.pingButton} onPress={ping}>
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
                <TouchableOpacity style={styles.routeDropdown} onPress={() => setRouteOpen(!routeOpen)}>
                  <Text style={styles.routeDropdownText}>{routes.find(r => r.value === selectedRoute)?.label || 'Select Route'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navigateButton} onPress={async () => { await sendToDom('navigate', { path: selectedRoute }); }}>
                  <Text style={styles.navigateButtonText}>Go</Text>
                </TouchableOpacity>
              </View>
              {routeOpen && (
                <View style={styles.dropdownMenu}>
                  {routes.map(route => (
                    <TouchableOpacity key={route.value} style={styles.dropdownItem} onPress={() => { setSelectedRoute(route.value); setRouteOpen(false); }}>
                      <Text style={[styles.dropdownItemText, route.value === selectedRoute && styles.dropdownItemTextSelected]}>{route.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.tokenSection}>
              <Text style={styles.sectionLabel}>Token Storage:</Text>
              <View style={styles.tokenInputRow}>
                <TextInput value={tokenInput} onChangeText={setTokenInput} placeholder={storedToken ? 'Edit stored token...' : 'Enter token to store...'} style={[styles.tokenTextInput, tokenInput !== storedToken && tokenInput.trim() && styles.tokenTextInputModified]} multiline numberOfLines={2} />
                <TouchableOpacity style={[styles.saveTokenButton, tokenInput !== storedToken && tokenInput.trim() ? styles.saveTokenButtonActive : styles.saveTokenButtonInactive]} onPress={saveToken} disabled={!tokenInput.trim() || tokenInput === storedToken}>
                  <Text style={[styles.saveTokenButtonText, tokenInput !== storedToken && tokenInput.trim() ? styles.saveTokenButtonTextActive : styles.saveTokenButtonTextInactive]}>{tokenInput === storedToken ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
              {storedToken ? (
                <View style={styles.storedTokenContainer}>
                  <View style={styles.tokenHeader}>
                    <Text style={styles.storedTokenLabel}>Stored Token:</Text>
                    <View style={styles.tokenStatus}>
                      <Text style={styles.tokenTypeText}>{getTokenType(storedToken)}</Text>
                      <Text style={[styles.tokenStatusText, (storedToken.includes('.') || storedToken.length >= 32) ? styles.tokenStatusValid : styles.tokenStatusInvalid]}>{(storedToken.includes('.') || storedToken.length >= 32) ? '✓ Valid' : '⚠ Invalid'}</Text>
                    </View>
                  </View>
                  <Text style={styles.storedTokenText} numberOfLines={2}>{storedToken}</Text>
                  {tokenTimestamp ? <Text style={styles.tokenTimestamp}>Saved: {tokenTimestamp}</Text> : null}
                  <View style={styles.tokenActionButtons}>
                    <TouchableOpacity style={styles.sendTokenButton} onPress={sendTokenToDom}><Text style={styles.sendTokenButtonText}>Send to DOM</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.clearTokenButton} onPress={clearToken}><Text style={styles.clearTokenButtonText}>Clear</Text></TouchableOpacity>
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
                <TouchableOpacity style={styles.clearResponseButton} onPress={() => setLastResponse(null)}>
                  <Text style={styles.clearResponseButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.responseText}>{lastResponse ? format(lastResponse) : 'None'}</Text>
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  toggleButtonText: { fontSize: 20, color: 'white' },
  debugOverlay: { position: 'absolute', top: 100, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e0e0e0', width: 400, maxHeight: 600, zIndex: 1001, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  debugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  debugTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  currentTime: { fontSize: 11, color: '#6c757d', marginTop: 2 },
  closeButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 14, color: '#666' },
  debugContent: { flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#fafafa' },
  pingButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, minWidth: 50, alignItems: 'center' },
  pingButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  navigationSection: { marginBottom: 16 },
  currentRouteDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f8f9fa', borderRadius: 4, borderWidth: 1, borderColor: '#e9ecef' },
  currentRouteLabel: { fontSize: 10, fontWeight: '600', color: '#495057', marginRight: 8 },
  currentRouteValue: { fontSize: 10, color: '#007AFF', fontFamily: 'monospace', fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#495057', marginBottom: 8 },
  routeSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDropdown: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10 },
  routeDropdownText: { fontSize: 14, color: '#333' },
  dropdownArrow: { fontSize: 12, color: '#666' },
  dropdownMenu: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginTop: 4 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemText: { fontSize: 14, color: '#333' },
  dropdownItemTextSelected: { color: '#007AFF', fontWeight: '600' },
  navigateButton: { backgroundColor: '#28a745', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, minWidth: 40, alignItems: 'center' },
  navigateButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  tokenSection: { marginBottom: 16 },
  tokenInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  tokenTextInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#fafafa', minHeight: 40 },
  tokenTextInputModified: { borderColor: '#007AFF', backgroundColor: '#f0f8ff' },
  saveTokenButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, minWidth: 50, alignItems: 'center' },
  saveTokenButtonActive: { backgroundColor: '#007AFF' },
  saveTokenButtonInactive: { backgroundColor: '#6c757d' },
  saveTokenButtonText: { fontSize: 12, fontWeight: '600' },
  saveTokenButtonTextActive: { color: 'white' },
  saveTokenButtonTextInactive: { color: '#adb5bd' },
  storedTokenContainer: { backgroundColor: '#e8f5e8', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#c3e6c3' },
  tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  storedTokenLabel: { fontSize: 11, fontWeight: '600', color: '#155724' },
  tokenStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.7)', alignItems: 'center' },
  tokenTypeText: { fontSize: 8, fontWeight: '600', color: '#007AFF', marginBottom: 2 },
  tokenStatusText: { fontSize: 9, fontWeight: '600' },
  tokenStatusValid: { color: '#155724' },
  tokenStatusInvalid: { color: '#721c24' },
  storedTokenText: { fontSize: 10, color: '#155724', fontFamily: 'monospace', marginBottom: 4 },
  tokenTimestamp: { fontSize: 9, color: '#6c757d', fontStyle: 'italic', marginBottom: 8 },
  tokenActionButtons: { flexDirection: 'row', gap: 8 },
  sendTokenButton: { backgroundColor: '#fd7e14', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  sendTokenButtonText: { color: 'white', fontSize: 10, fontWeight: '600' },
  clearTokenButton: { backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  clearTokenButtonText: { color: 'white', fontSize: 10, fontWeight: '600' },
  noTokenText: { fontSize: 11, color: '#6c757d', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 16 },
  responseContainer: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e9ecef' },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  responseLabel: { fontSize: 12, fontWeight: '600', color: '#495057' },
  responseText: { fontSize: 11, color: '#6c757d', fontFamily: 'monospace' },
  clearResponseButton: { backgroundColor: '#6c757d', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  clearResponseButtonText: { color: 'white', fontSize: 10, fontWeight: '600' },
});


