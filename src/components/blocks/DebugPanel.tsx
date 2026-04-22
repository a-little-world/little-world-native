import { environment } from "@/environment";
import { apiFetch, clearJwtTokens, saveJwtTokens } from "@/src/api/helpers";
import {
  getBackendUrl,
  secureStoreIsAvailable,
  supportsAppIntegrity,
} from "@/src/helpers/appInfos";
import { useAuthStore } from "@/src/store/authStore";
import { debugStore, useDebugStore } from "@/src/store/debugStore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDomCommunicationContext } from "./DomCommunicationCore";

type SectionKey = "backend" | "tokens" | "dom" | "appinfo";

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{expanded ? "▾" : "▸"}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

function Btn({
  label,
  onPress,
  color = "#007AFF",
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

const ROUTES = [
  { label: "Sign Up", value: "/sign-up" },
  { label: "Login", value: "/login" },
  { label: "Profile", value: "/app/profile" },
  { label: "Settings", value: "/settings" },
  { label: "Help", value: "/help" },
];

export default function DebugPanel() {
  const { sendToDom } = useDomCommunicationContext();
  const { accessToken, refreshToken } = useAuthStore();

  const [visible, setVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TAPS_REQUIRED = 1;
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    backend: true,
    tokens: true,
    dom: false,
    appinfo: false,
  });

  // Backend URL state
  const { backendUrlOverride, debugAccessToken, debugRefreshToken } =
    useDebugStore();
  const [urlInput, setUrlInput] = useState(
    () => debugStore.get().backendUrlOverride ?? environment.backendUrl,
  );

  // Sync urlInput once the store finishes rehydrating from SecureStore
  useEffect(() => {
    return useDebugStore.persist.onFinishHydration((state) => {
      setUrlInput(state.backendUrlOverride ?? environment.backendUrl);
    });
  }, []);

  // DOM section state
  const [pingMessage, setPingMessage] = useState("Hello from RN");
  const [selectedRoute, setSelectedRoute] = useState("/login");
  const [routeOpen, setRouteOpen] = useState(false);

  // Feedback
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  // Clock while panel open
  useEffect(() => {
    if (!visible) return;
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible]);

  const toggle = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const result = (msg: string) => setLastResult(msg);

  // ── Backend URL ──────────────────────────────────────────────────────────
  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    debugStore.set({ backendUrlOverride: trimmed });
    result(`Backend URL set to: ${trimmed}`);
  };

  const resetUrl = () => {
    debugStore.set({ backendUrlOverride: null });
    setUrlInput(environment.backendUrl);
    result(`Backend URL reset to default`);
  };

  // ── Auth Tokens ───────────────────────────────────────────────────────────
  const saveToDebug = () => {
    debugStore.get().setDebugTokens(accessToken ?? null, refreshToken ?? null);
    result("Saved current tokens to debug slot");
  };

  const loadFromDebug = async () => {
    try {
      const { debugAccessToken: a, debugRefreshToken: r } = debugStore.get();
      useAuthStore.setState({
        accessToken: a ?? undefined,
        refreshToken: r ?? undefined,
      });
      await saveJwtTokens(a ?? undefined, r ?? undefined);
      await sendToDom({
        action: "SET_AUTH_TOKENS",
        payload: { accessToken: a ?? undefined, refreshToken: r ?? undefined },
      });
      result("Debug tokens loaded into regular tokens + SecureStore");
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
      await sendToDom({
        action: "SET_AUTH_TOKENS",
        payload: { accessToken: undefined, refreshToken: undefined },
      });
      await sendToDom({ action: "NAVIGATE", payload: { path: "/login" } });
      result("Regular tokens cleared");
    } catch (e: any) {
      result(`Clear failed: ${e}`);
    }
  };

  const clearDebugTokens = () => {
    debugStore.get().clearDebugTokens();
    result("Debug tokens cleared");
  };

  // ── DOM Communication ─────────────────────────────────────────────────────
  const ping = async () => {
    try {
      const res = await sendToDom({
        action: "PING",
        payload: { message: pingMessage },
      });
      result(res.ok ? `Pong: ${res.data?.message}` : `Error: ${res.error}`);
    } catch (e: any) {
      result(`Ping failed: ${e}`);
    }
  };

  const getWindowOrigin = async () => {
    try {
      const res = await sendToDom({ action: "GET_WINDOW_ORIGIN", payload: {} });
      result(res.ok ? `Origin: ${res.data?.origin}` : `Error: ${res.error}`);
    } catch (e: any) {
      result(`Error: ${e}`);
    }
  };

  const navigate = async () => {
    try {
      await sendToDom({ action: "NAVIGATE", payload: { path: selectedRoute } });
      result(`Navigated to ${selectedRoute}`);
    } catch (e: any) {
      result(`Navigate failed: ${e}`);
    }
  };

  const checkAuth = async () => {
    try {
      await apiFetch("/api/user/authenticated");
      result("Authenticated");
    } catch {
      result("Not authenticated");
    }
  };

  const handleSecretTap = () => {
    if (tapResetTimer.current) clearTimeout(tapResetTimer.current);
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= TAPS_REQUIRED) {
        setVisible(true);
        return 0;
      }
      tapResetTimer.current = setTimeout(() => setTapCount(0), 1500);
      return next;
    });
  };

  const truncate = (s: string | null | undefined, len = 32) => {
    if (!s) return "—";
    return s.length > len ? `${s.slice(0, len / 2)}…${s.slice(-len / 2)}` : s;
  };

  const appInfoRows = useMemo(
    () => [
      { label: "Backend URL", value: getBackendUrl() },
      { label: "Integrity", value: String(supportsAppIntegrity()) },
      { label: "SecureStore", value: String(secureStoreIsAvailable()) },
    ],
    [],
  );

  return (
    <>
      <TouchableOpacity
        style={styles.secretZone}
        onPress={handleSecretTap}
        activeOpacity={1}
      />

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
            {/* ── Backend URL ── */}
            <Section
              title="Backend URL"
              expanded={expanded.backend}
              onToggle={() => toggle("backend")}
            >
              <Row
                label="Active"
                value={
                  backendUrlOverride
                    ? `⚠ ${backendUrlOverride}`
                    : environment.backendUrl
                }
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

            {/* ── Auth Tokens ── */}
            <Section
              title="Auth Tokens"
              expanded={expanded.tokens}
              onToggle={() => toggle("tokens")}
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
            </Section>

            {/* ── DOM Communication ── */}
            <Section
              title="DOM Communication"
              expanded={expanded.dom}
              onToggle={() => toggle("dom")}
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
                    {ROUTES.find((r) => r.value === selectedRoute)?.label ??
                      selectedRoute}
                  </Text>
                  <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
                <Btn label="Go" onPress={navigate} color="#28a745" small />
              </View>
              {routeOpen && (
                <View style={styles.dropdownMenu}>
                  {ROUTES.map((r) => (
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

            {/* ── App Info ── */}
            <Section
              title="App Info"
              expanded={expanded.appinfo}
              onToggle={() => toggle("appinfo")}
            >
              {appInfoRows.map((item) => (
                <Row key={item.label} label={item.label} value={item.value} />
              ))}
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
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  secretZone: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    zIndex: 1000,
  },

  panel: {
    position: "absolute",
    top: 24,
    left: 12,
    right: 12,
    maxHeight: 620,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ebebeb",
    backgroundColor: "#f8f8f8",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  headerClock: { fontSize: 11, color: "#888", marginTop: 2 },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { fontSize: 13, color: "#555" },

  scroll: { flex: 1 },

  section: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#333" },
  chevron: { fontSize: 13, color: "#007AFF" },
  sectionBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },

  subLabel: { fontSize: 11, fontWeight: "600", color: "#888", marginBottom: 4 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    width: 64,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 11,
    color: "#333",
    fontFamily: "monospace",
    flex: 1,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    backgroundColor: "#fafafa",
    marginVertical: 6,
  },

  btnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: "center",
  },
  btnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnText: { color: "white", fontSize: 13, fontWeight: "600" },
  btnTextSmall: { fontSize: 11 },

  dropdown: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fafafa",
  },
  dropdownText: { fontSize: 13, color: "#333" },
  dropdownArrow: { fontSize: 11, color: "#666" },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 7,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  dropdownItemText: { fontSize: 13, color: "#333" },
  dropdownItemActive: { color: "#007AFF", fontWeight: "600" },

  resultBox: {
    margin: 12,
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#c8d8ff",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  resultLabel: { fontSize: 11, fontWeight: "700", color: "#3355cc" },
  resultClear: { fontSize: 11, color: "#888" },
  resultText: { fontSize: 11, color: "#223", fontFamily: "monospace" },
});
