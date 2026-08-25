import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import { environment } from '@/environment';
import {
  apiFetch,
  clearJwtTokens,
  saveIntegrityBypassToken,
  saveJwtTokens,
} from '@/src/api/helpers';
import {
  getBackendUrl,
  secureStoreIsAvailable,
  supportsAppIntegrity,
} from '@/src/helpers/appInfos';
import { decryptBypassToken } from '@/src/helpers/bypassToken';
import { useAuthStore } from '@/src/store/authStore';
import {
  debugStore,
  FetchError,
  ReactError,
  useDebugStore,
} from '@/src/store/debugStore';
import {
  canUseFullScreenIntent,
  openFullScreenIntentSettings,
} from '@/src/utils/incomingCall';

import { useDomCommunicationContext } from './DomCommunicationCore';

const DEVELOPER_SECRET_DIGEST =
  '446bb2136d0c9299b80da0ed06c22a131cd5f5f1d0459c4a39f2b0db5608d40a';

type SectionKey =
  | 'backend'
  | 'tokens'
  | 'dom'
  | 'appinfo'
  | 'calls'
  | 'fetchErrors'
  | 'reactErrors';

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  badge,
  warning,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  badge?: number;
  warning?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {warning && <Text style={{ marginLeft: 4, fontSize: 13 }}>⚠️</Text>}
          {badge != null && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function Row({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {warning && <Text style={{ marginRight: 4, fontSize: 11 }}>⚠️</Text>}
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Btn({
  label,
  onPress,
  color = '#007AFF',
  small = false,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: color }, small && styles.btnSmall]}
      onPress={onPress}
    >
      <Text style={[styles.btnText, small && styles.btnTextSmall]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Checkbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onToggle}>
      <Text style={styles.checkboxBox}>{checked ? '☑' : '☐'}</Text>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function FetchErrorItem({
  error,
  expanded,
  onToggle,
}: {
  error: FetchError;
  expanded: boolean;
  onToggle: () => void;
}) {
  const time = error.timestamp.slice(11, 19); // HH:MM:SS from ISO
  const fmt = (v: unknown) => {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };
  return (
    <TouchableOpacity style={styles.errorItem} onPress={onToggle}>
      <View style={styles.errorItemHeader}>
        <Text style={styles.errorTimestamp}>{time}</Text>
        <Text style={styles.errorSource}>
          {error.source === 'native' ? 'N:' : 'F:'}
        </Text>
        <Text style={styles.errorSummary} numberOfLines={1}>
          {error.method} {error.endpoint}
          {error.status != null ? ` → ${error.status}` : ''}
        </Text>
        <Text style={styles.errorChevron}>{expanded ? '▾' : '▸'}</Text>
      </View>
      {expanded && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorDetailLabel}>URL</Text>
          <Text style={styles.errorDetailValue}>{error.url}</Text>
          {error.status != null && (
            <>
              <Text style={styles.errorDetailLabel}>Status</Text>
              <Text style={styles.errorDetailValue}>{error.status}</Text>
            </>
          )}
          <Text style={styles.errorDetailLabel}>Headers</Text>
          <Text style={styles.errorDetailValue}>{fmt(error.headers)}</Text>
          {error.requestBody != null && (
            <>
              <Text style={styles.errorDetailLabel}>Request Body</Text>
              <Text style={styles.errorDetailValue}>
                {fmt(error.requestBody)}
              </Text>
            </>
          )}
          <Text style={styles.errorDetailLabel}>Error</Text>
          <Text style={styles.errorDetailValue}>{fmt(error.error)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ReactErrorItem({
  error,
  expanded,
  onToggle,
}: {
  error: ReactError;
  expanded: boolean;
  onToggle: () => void;
}) {
  const time = error.timestamp.slice(11, 19);
  const brief =
    error.message.length > 60
      ? error.message.slice(0, 60) + '…'
      : error.message;
  return (
    <TouchableOpacity style={styles.errorItem} onPress={onToggle}>
      <View style={styles.errorItemHeader}>
        <Text style={styles.errorTimestamp}>{time}</Text>
        <Text style={styles.errorSource}>
          {error.source === 'native' ? 'N:' : 'F:'}
        </Text>
        <Text style={styles.errorSummary} numberOfLines={1}>
          {brief}
        </Text>
        <Text style={styles.errorChevron}>{expanded ? '▾' : '▸'}</Text>
      </View>
      {expanded && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorDetailLabel}>Message</Text>
          <Text style={styles.errorDetailValue}>{error.message}</Text>
          {error.stack && (
            <>
              <Text style={styles.errorDetailLabel}>Stack</Text>
              <Text style={styles.errorDetailValue}>{error.stack}</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROUTES = [
  { label: 'Sign Up', value: '/sign-up' },
  { label: 'Login', value: '/login' },
  { label: 'Profile', value: '/app/profile' },
  { label: 'Settings', value: '/settings' },
  { label: 'Help', value: '/help' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function DebugPanel() {
  const { sendToDom } = useDomCommunicationContext();
  const { accessToken, refreshToken } = useAuthStore();
  const {
    backendUrlOverride,
    debugAccessToken,
    debugRefreshToken,
    bypassIntegrityChecks,
    integrityBypassToken,
    fetchErrors,
    reactErrors,
  } = useDebugStore();

  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Secret dialog
  const [secretDialogVisible, setSecretDialogVisible] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [secretError, setSecretError] = useState(false);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(() => ({
    appinfo: true,
    calls: false,
    backend: !!debugStore.get().backendUrlOverride,
    tokens: false,
    dom: false,
    fetchErrors: false,
    reactErrors: false,
  }));

  // Track which individual error items are expanded
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>(
    {},
  );

  const [fullScreenIntentOk, setFullScreenIntentOk] = useState<boolean | null>(
    null,
  );
  const refreshFullScreenIntent = () =>
    canUseFullScreenIntent()
      .then(setFullScreenIntentOk)
      .catch(() => {});
  const toggleError = (id: string) =>
    setExpandedErrors(prev => ({ ...prev, [id]: !prev[id] }));

  // Backend URL input
  const [urlInput, setUrlInput] = useState(
    () => debugStore.get().backendUrlOverride ?? environment.backendUrl,
  );

  // Sync urlInput once the store finishes rehydrating from SecureStore
  useEffect(() => {
    return useDebugStore.persist.onFinishHydration(state => {
      setUrlInput(state.backendUrlOverride ?? environment.backendUrl);
    });
  }, []);

  // DOM section state
  const [pingMessage, setPingMessage] = useState('Hello from RN');
  const [selectedRoute, setSelectedRoute] = useState('/login');
  const [routeOpen, setRouteOpen] = useState(false);

  // Feedback
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [clock, setClock] = useState('');

  // Clock while panel open
  useEffect(() => {
    if (!visible) return;
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible]);

  // Window origin — fetched once when panel opens
  const [windowOrigin, setWindowOrigin] = useState<string>('…');
  useEffect(() => {
    if (!visible) return;
    sendToDom({ action: 'GET_WINDOW_ORIGIN', payload: {} })
      .then(res =>
        setWindowOrigin(
          res.ok ? (res.data?.origin ?? 'unknown') : `error: ${res.error}`,
        ),
      )
      .catch(() => setWindowOrigin('error'));
  }, [visible]);

  const toggle = (key: SectionKey) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const result = (msg: string) => setLastResult(msg);

  // ── Backend URL ──────────────────────────────────────────────────────────
  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (trimmed === environment.backendUrl) {
      debugStore.set({ backendUrlOverride: null });
      result(`Backend URL reset to default`);
    } else {
      debugStore.set({ backendUrlOverride: trimmed });
      result(`Backend URL set to: ${trimmed}`);
    }
  };

  const resetUrl = () => {
    debugStore.set({ backendUrlOverride: null });
    setUrlInput(environment.backendUrl);
    result(`Backend URL reset to default`);
  };

  // ── Auth Tokens ───────────────────────────────────────────────────────────
  const saveToDebug = () => {
    debugStore.get().setDebugTokens(accessToken ?? null, refreshToken ?? null);
    result('Saved current tokens to debug slot');
  };

  const loadFromDebug = async () => {
    try {
      const { debugAccessToken: a, debugRefreshToken: r } = debugStore.get();
      useAuthStore.setState({
        accessToken: a ?? undefined,
        refreshToken: r ?? undefined,
      });
      await saveJwtTokens(a ?? undefined, r ?? undefined);
      result('Debug tokens loaded into regular tokens + SecureStore');
    } catch (e: any) {
      result(`Load failed: ${e}`);
    }
  };

  const clearRegularTokens = async () => {
    try {
      await clearJwtTokens();
      useAuthStore.setState({
        accessToken: undefined,
        refreshToken: undefined,
      });
      await sendToDom({ action: 'NAVIGATE', payload: { path: '/login' } });
      result('Regular tokens cleared');
    } catch (e: any) {
      result(`Clear failed: ${e}`);
    }
  };

  const clearDebugTokens = () => {
    debugStore.get().clearDebugTokens();
    result('Debug tokens cleared');
  };

  // ── DOM Communication ─────────────────────────────────────────────────────
  const ping = async () => {
    try {
      const res = await sendToDom({
        action: 'PING',
        payload: { message: pingMessage },
      });
      result(res.ok ? `Pong: ${res.data?.message}` : `Error: ${res.error}`);
    } catch (e: any) {
      result(`Ping failed: ${e}`);
    }
  };

  const getWindowOrigin = async () => {
    try {
      const res = await sendToDom({ action: 'GET_WINDOW_ORIGIN', payload: {} });
      result(res.ok ? `Origin: ${res.data?.origin}` : `Error: ${res.error}`);
    } catch (e: any) {
      result(`Error: ${e}`);
    }
  };

  const navigate = async () => {
    try {
      await sendToDom({ action: 'NAVIGATE', payload: { path: selectedRoute } });
      result(`Navigated to ${selectedRoute}`);
    } catch (e: any) {
      result(`Navigate failed: ${e}`);
    }
  };

  const checkAuth = async () => {
    let authenticated = false;
    try {
      authenticated = await apiFetch('/api/user/authenticated').then(
        response => response === true,
      );
    } catch {}
    result(`${authenticated ? '' : 'Not'} Authenticated`);
  };

  // ── Secret tap ────────────────────────────────────────────────────────────
  const handleSecretTap = () => {
    if (tapResetTimer.current) clearTimeout(tapResetTimer.current);
    const tapsRequired = debugStore.get().debugEnabled ? 1 : 7;
    setTapCount(prev => {
      const next = prev + 1;
      if (next >= tapsRequired) {
        if (debugStore.get().debugEnabled) {
          setVisible(true);
        } else {
          setSecretInput('');
          setSecretError(false);
          setSecretDialogVisible(true);
        }
        return 0;
      }
      tapResetTimer.current = setTimeout(() => setTapCount(0), 1500);
      return next;
    });
  };

  const handleSecretSubmit = async () => {
    const digest = await digestStringAsync(
      CryptoDigestAlgorithm.SHA256,
      secretInput,
    );
    if (digest === DEVELOPER_SECRET_DIGEST) {
      try {
        const bypassToken = await decryptBypassToken(secretInput);
        debugStore.get().setIntegrityBypassToken(bypassToken);
        await saveIntegrityBypassToken(bypassToken);
      } catch (e) {
        debugStore.get().addReactError({
          source: 'native',
          message: 'Error during bypass token decryption',
          stack: String(e),
        });
        console.error(e);
      }
      debugStore.get().setDebugEnabled(true);
      setSecretDialogVisible(false);
      setVisible(true);
    } else {
      setSecretError(true);
    }
  };

  const handleStopDebugging = () => {
    setVisible(false);
    debugStore.get().setDebugEnabled(false);
  };

  const truncate = (s: string | null | undefined, len = 32) => {
    if (!s) return '—';
    return s.length > len ? `${s.slice(0, len / 2)}…${s.slice(-len / 2)}` : s;
  };

  const appInfoRows = useMemo(
    () => [
      { label: 'Backend URL', value: getBackendUrl() },
      { label: 'Integrity support', value: String(supportsAppIntegrity()) },
      {
        label: 'SecureStore available',
        value: String(secureStoreIsAvailable()),
      },
    ],
    [],
  );

  return (
    <>
      <Pressable
        style={styles.secretZone}
        onPress={handleSecretTap}
        android_ripple={null}
      />

      {/* ── Secret unlock dialog ── */}
      <Modal
        visible={secretDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSecretDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              So you think you're a developer, huh? Prove it.
            </Text>
            <TextInput
              style={[styles.input, styles.modalInput]}
              value={secretInput}
              onChangeText={v => {
                setSecretInput(v);
                setSecretError(false);
              }}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSecretSubmit}
            />
            {secretError && <Text style={styles.modalError}>Try again.</Text>}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setSecretDialogVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnOk]}
                onPress={handleSecretSubmit}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {visible && (
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Debug Panel</Text>
              {clock ? <Text style={styles.headerClock}>{clock}</Text> : null}
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── App Info ── */}
            <Section
              title="App Info"
              expanded={expanded.appinfo}
              onToggle={() => toggle('appinfo')}
            >
              {appInfoRows.map(item => (
                <Row key={item.label} label={item.label} value={item.value} />
              ))}
              <Row label="Window origin" value={windowOrigin} />
            </Section>

            {/* ── Incoming calls ── */}
            <Section
              title="Incoming calls"
              warning={fullScreenIntentOk === false}
              expanded={expanded.calls}
              onToggle={() => {
                toggle('calls');
                refreshFullScreenIntent();
              }}
            >
              <Row
                label="Full screen intent"
                warning={fullScreenIntentOk === false}
                value={
                  fullScreenIntentOk === null
                    ? '…'
                    : fullScreenIntentOk
                      ? 'allowed'
                      : 'DENIED — no lock screen call UI'
                }
              />
              <View style={styles.btnRow}>
                <Btn label="Re-check" onPress={refreshFullScreenIntent} />
                <Btn
                  label="Open setting"
                  color="#FF9500"
                  onPress={() => openFullScreenIntentSettings()}
                />
              </View>
            </Section>

            {/* ── Backend URL ── */}
            <Section
              title="Backend URL"
              warning={!!backendUrlOverride}
              expanded={expanded.backend}
              onToggle={() => toggle('backend')}
            >
              <Row
                label="Active"
                warning={!!backendUrlOverride}
                value={backendUrlOverride ?? environment.backendUrl}
              />
              <TextInput
                style={styles.input}
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://example.com"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.btnRow}>
                <Btn label="Apply" onPress={applyUrl} color="#007AFF" />
                <Btn
                  label="Reset to default"
                  onPress={resetUrl}
                  color="#6c757d"
                />
              </View>
            </Section>

            {/* ── Auth ── */}
            <Section
              title="Auth"
              expanded={expanded.tokens}
              onToggle={() => toggle('tokens')}
            >
              <Text style={styles.subLabel}>Regular tokens</Text>
              <Row label="Access" value={truncate(accessToken)} />
              <Row label="Refresh" value={truncate(refreshToken)} />
              <Text style={[styles.subLabel, { marginTop: 8 }]}>
                Debug tokens
              </Text>
              <Row label="Access" value={truncate(debugAccessToken)} />
              <Row label="Refresh" value={truncate(debugRefreshToken)} />
              <View style={styles.btnRow}>
                <Btn
                  label="Regular → debug"
                  onPress={saveToDebug}
                  color="#28a745"
                  small
                />
                <Btn
                  label="Debug → regular"
                  onPress={loadFromDebug}
                  color="#fd7e14"
                  small
                />
                <Btn
                  label="Check auth"
                  onPress={checkAuth}
                  color="#6610f2"
                  small
                />
              </View>
              <View style={styles.btnRow}>
                <Btn
                  label="Clear regular"
                  onPress={clearRegularTokens}
                  color="#dc3545"
                  small
                />
                <Btn
                  label="Clear debug"
                  onPress={clearDebugTokens}
                  color="#6c757d"
                  small
                />
              </View>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Integrity</Text>
              <Checkbox
                label="Bypass integrity checks"
                checked={bypassIntegrityChecks}
                onToggle={() =>
                  debugStore
                    .get()
                    .setBypassIntegrityChecks(!bypassIntegrityChecks)
                }
              />
              <Text style={[styles.subLabel, { marginTop: 8 }]}>
                Bypass token: {integrityBypassToken}
              </Text>
            </Section>

            {/* ── DOM Communication ── */}
            <Section
              title="DOM Communication"
              expanded={expanded.dom}
              onToggle={() => toggle('dom')}
            >
              <TextInput
                style={styles.input}
                value={pingMessage}
                onChangeText={setPingMessage}
                placeholder="Ping message"
              />
              <View style={styles.btnRow}>
                <Btn label="Ping" onPress={ping} color="#007AFF" small />
                <Btn
                  label="Window origin"
                  onPress={getWindowOrigin}
                  color="#007AFF"
                  small
                />
              </View>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Navigate</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setRouteOpen(!routeOpen)}
                >
                  <Text style={styles.dropdownText}>
                    {ROUTES.find(r => r.value === selectedRoute)?.label ??
                      selectedRoute}
                  </Text>
                  <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
                <Btn label="Go" onPress={navigate} color="#28a745" small />
              </View>
              {routeOpen && (
                <View style={styles.dropdownMenu}>
                  {ROUTES.map(r => (
                    <TouchableOpacity
                      key={r.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedRoute(r.value);
                        setRouteOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          r.value === selectedRoute &&
                            styles.dropdownItemActive,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Section>

            {/* ── Fetch Errors ── */}
            <Section
              title="Fetch Errors"
              badge={fetchErrors.length}
              expanded={expanded.fetchErrors}
              onToggle={() => toggle('fetchErrors')}
            >
              {fetchErrors.length > 0 && (
                <Btn
                  label="Clear all"
                  onPress={() => debugStore.get().clearFetchErrors()}
                  color="#dc3545"
                  small
                />
              )}
              {fetchErrors.length === 0 ? (
                <Text style={styles.emptyText}>No fetch errors</Text>
              ) : (
                fetchErrors.map(e => (
                  <FetchErrorItem
                    key={e.id}
                    error={e}
                    expanded={!!expandedErrors[e.id]}
                    onToggle={() => toggleError(e.id)}
                  />
                ))
              )}
            </Section>

            {/* ── React Errors ── */}
            <Section
              title="React Errors"
              badge={reactErrors.length}
              expanded={expanded.reactErrors}
              onToggle={() => toggle('reactErrors')}
            >
              {reactErrors.length > 0 && (
                <Btn
                  label="Clear all"
                  onPress={() => debugStore.get().clearReactErrors()}
                  color="#dc3545"
                  small
                />
              )}
              {reactErrors.length === 0 ? (
                <Text style={styles.emptyText}>No React errors</Text>
              ) : (
                reactErrors.map(e => (
                  <ReactErrorItem
                    key={e.id}
                    error={e}
                    expanded={!!expandedErrors[e.id]}
                    onToggle={() => toggleError(e.id)}
                  />
                ))
              )}
            </Section>

            {/* Result */}
            {lastResult !== null && (
              <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultLabel}>Result</Text>
                  <TouchableOpacity onPress={() => setLastResult(null)}>
                    <Text style={styles.resultClear}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.resultText}>{lastResult}</Text>
              </View>
            )}

            {/* Stop Debugging */}
            <View style={styles.stopRow}>
              <Btn
                label="Stop Debugging"
                onPress={handleStopDebugging}
                color="#dc3545"
              />
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  secretZone: {
    position: Platform.select({ web: 'fixed', default: 'absolute' }),
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    zIndex: 1000,
    cursor: 'default',
    // backgroundColor: "transparent",
  },

  panel: {
    position: 'absolute',
    top: 48,
    left: 12,
    right: 12,
    maxHeight: 620,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    backgroundColor: '#f8f8f8',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  headerClock: { fontSize: 11, color: '#888', marginTop: 2 },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 13, color: '#555' },

  scroll: { flex: 1 },

  section: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#333' },
  chevron: { fontSize: 13, color: '#007AFF' },
  sectionBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },

  badge: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  subLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 4 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    width: 90,
    flexShrink: 0,
  },
  rowValue: { fontSize: 11, color: '#333', fontFamily: 'monospace', flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  checkboxBox: { fontSize: 16, marginRight: 6, color: '#333' },
  checkboxLabel: { fontSize: 12, color: '#333', flex: 1 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    backgroundColor: '#fafafa',
    marginVertical: 6,
  },

  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
  },
  btnSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  btnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  btnTextSmall: { fontSize: 11 },

  dropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fafafa',
  },
  dropdownText: { fontSize: 13, color: '#333' },
  dropdownArrow: { fontSize: 11, color: '#666' },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 7,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  dropdownItemText: { fontSize: 13, color: '#333' },
  dropdownItemActive: { color: '#007AFF', fontWeight: '600' },

  // Error items
  emptyText: {
    fontSize: 11,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  errorItem: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffd0d0',
    borderRadius: 6,
    backgroundColor: '#fff8f8',
    overflow: 'hidden',
  },
  errorItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  errorTimestamp: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  errorSource: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    fontWeight: '700',
    flexShrink: 0,
  },
  errorSummary: {
    flex: 1,
    fontSize: 11,
    color: '#c0392b',
    fontFamily: 'monospace',
  },
  errorChevron: { fontSize: 11, color: '#c0392b', flexShrink: 0 },
  errorDetails: {
    borderTopWidth: 1,
    borderTopColor: '#ffd0d0',
    padding: 10,
    gap: 4,
  },
  errorDetailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    marginTop: 6,
  },
  errorDetailValue: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },

  resultBox: {
    margin: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c8d8ff',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultLabel: { fontSize: 11, fontWeight: '700', color: '#3355cc' },
  resultClear: { fontSize: 11, color: '#888' },
  resultText: { fontSize: 11, color: '#223', fontFamily: 'monospace' },

  stopRow: {
    margin: 12,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  modalInput: { marginBottom: 0 },
  modalError: { fontSize: 12, color: '#dc3545', marginTop: 6 },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 7,
  },
  modalBtnCancel: { backgroundColor: '#e0e0e0' },
  modalBtnOk: { backgroundColor: '#007AFF' },
  modalBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
});
