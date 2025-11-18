import { saveJwtTokens } from "@/src/api/token";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getBackendUrl,
  secureStoreIsAvailable,
  supportsAppIntegrity,
} from "../../helpers/appInfos";
import { useDomCommunicationContext } from "./DomCommunicationCore";

export default function DomDebugPanel() {
  const { sendToDom } = useDomCommunicationContext();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("Hello from React Native");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState("/sign-up");
  const [routeOpen, setRouteOpen] = useState(false);
  const [now, setNow] = useState("");
  const [appInfoExpanded, setAppInfoExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [secureStoreDecryptionKeyInfo, setSecureStoreDecryptionKeyInfo] =
    useState<string>("Loading...");
  const [domActionsExpanded, setDomActionsExpanded] = useState(true);

  const routes = useMemo(
    () => [
      { label: "Sign Up", value: "/sign-up" },
      { label: "Login", value: "/login" },
      { label: "Profile", value: "/profile" },
      { label: "Settings", value: "/settings" },
      { label: "Help", value: "/help" },
    ],
    []
  );

  const appInfoData = useMemo(
    () => [
      { key: "supportsAppIntegrity", value: supportsAppIntegrity() },
      { key: "getBackendUrl", value: getBackendUrl() },
      { key: "secureStoreIsAvailable", value: secureStoreIsAvailable() },
    ],
    [secureStoreDecryptionKeyInfo]
  );

  useEffect(() => {
    if (!visible) return;
    const update = () => setNow(new Date().toLocaleTimeString());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [visible]);

  const getWindowOrigin = async () => {
    try {
      const res = await sendToDom({
        action: "GET_WINDOW_ORIGIN",
        payload: {
          message,
        },
      });
      setLastResponse(res.ok ? res.data?.origin : res.error);
    } catch (e: any) {
      setLastResponse({ ok: false, error: String(e) });
    }
  };

  const clearTokens = async () => {
    try {
      await saveJwtTokens(null, null);
      const res = await sendToDom({
        action: "SET_AUTH_TOKENS",
        payload: {
          accessToken: null,
          refreshToken: null,
        },
      });

      if (res.ok) {
        await sendToDom({
          action: "NAVIGATE",
          payload: {
            path: "/login",
          },
        });
      }

      setLastResponse(res.ok ? "Tokens cleared" : res.error);
    } catch (e: any) {
      setLastResponse({ ok: false, error: String(e) });
    }
  };

  const ping = async () => {
    try {
      const res = await sendToDom({
        action: "PING",
        payload: {
          message,
        },
      });
      setLastResponse(res.ok ? res.data?.message : res.error);
    } catch (e: any) {
      setLastResponse({ ok: false, error: String(e) });
    }
  };

  const format = (value: any) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setVisible(!visible)}
      >
        <Text style={styles.toggleButtonText}>🐛</Text>
      </TouchableOpacity>
      {visible && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugHeader}>
            <View>
              <Text style={styles.debugTitle}>DOM Debug Panel</Text>
              {now ? <Text style={styles.currentTime}>{now}</Text> : null}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.debugContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Actions Panel */}
            <View style={styles.appInfoSection}>
              <TouchableOpacity
                style={styles.appInfoHeader}
                onPress={() => setActionsExpanded(!actionsExpanded)}
              >
                <Text style={styles.sectionLabel}>Actions:</Text>
                <Text style={styles.expandButton}>
                  {actionsExpanded ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>
              {actionsExpanded && (
                <View style={styles.appInfoContent}>
                  {/* Dom communication test actions */}
                  <View style={styles.appInfoSection}>
                    <TouchableOpacity
                      style={styles.appInfoHeader}
                      onPress={() => setDomActionsExpanded(!domActionsExpanded)}
                    >
                      <Text style={styles.sectionLabel}>
                        Dom communication test actions
                      </Text>
                      <Text style={styles.expandButton}>
                        {domActionsExpanded ? "▼" : "▶"}
                      </Text>
                    </TouchableOpacity>
                    {domActionsExpanded && (
                      <View style={styles.appInfoContent}>
                        <View style={styles.inputRow}>
                          <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Message to send to DOM"
                            style={styles.textInput}
                          />
                          <TouchableOpacity
                            style={styles.pingButton}
                            onPress={ping}
                          >
                            <Text style={styles.pingButtonText}>Ping</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.pingButton}
                            onPress={getWindowOrigin}
                          >
                            <Text style={styles.pingButtonText}>
                              Get Window Origin
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.clearTokenButton}
                            onPress={clearTokens}
                          >
                            <Text style={styles.clearTokenButtonText}>
                              Clear tokens
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.navigationSection}>
                          <Text style={styles.sectionLabel}>Navigation:</Text>
                          <View style={styles.currentRouteDisplay}>
                            <Text style={styles.currentRouteLabel}>
                              Current Route:
                            </Text>
                            <Text style={styles.currentRouteValue}>
                              {selectedRoute}
                            </Text>
                          </View>
                          <View style={styles.routeSelector}>
                            <TouchableOpacity
                              style={styles.routeDropdown}
                              onPress={() => setRouteOpen(!routeOpen)}
                            >
                              <Text style={styles.routeDropdownText}>
                                {routes.find((r) => r.value === selectedRoute)
                                  ?.label || "Select Route"}
                              </Text>
                              <Text style={styles.dropdownArrow}>▼</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.navigateButton}
                              onPress={async () => {
                                await sendToDom({
                                  action: "NAVIGATE",
                                  payload: { path: selectedRoute },
                                });
                              }}
                            >
                              <Text style={styles.navigateButtonText}>Go</Text>
                            </TouchableOpacity>
                          </View>
                          {routeOpen && (
                            <View style={styles.dropdownMenu}>
                              {routes.map((route) => (
                                <TouchableOpacity
                                  key={route.value}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setSelectedRoute(route.value);
                                    setRouteOpen(false);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.dropdownItemText,
                                      route.value === selectedRoute &&
                                        styles.dropdownItemTextSelected,
                                    ]}
                                  >
                                    {route.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.responseContainer}>
                          <View style={styles.responseHeader}>
                            <Text style={styles.responseLabel}>
                              Last Response:
                            </Text>
                            <TouchableOpacity
                              style={styles.clearResponseButton}
                              onPress={() => setLastResponse(null)}
                            >
                              <Text style={styles.clearResponseButtonText}>
                                Clear
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.responseText}>
                            {lastResponse ? format(lastResponse) : "None"}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
            <View style={styles.appInfoSection}>
              <TouchableOpacity
                style={styles.appInfoHeader}
                onPress={() => setAppInfoExpanded(!appInfoExpanded)}
              >
                <Text style={styles.sectionLabel}>App Info:</Text>
                <Text style={styles.expandButton}>
                  {appInfoExpanded ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>
              {appInfoExpanded && (
                <View style={styles.appInfoContent}>
                  {appInfoData.map((item, index) => (
                    <View key={index} style={styles.keyValueRow}>
                      <Text style={styles.keyText}>{item.key}:</Text>
                      <Text style={styles.valueText}>{format(item.value)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.responseContainer}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseLabel}>Last Response:</Text>
                <TouchableOpacity
                  style={styles.clearResponseButton}
                  onPress={() => setLastResponse(null)}
                >
                  <Text style={styles.clearResponseButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.responseText}>
                {lastResponse ? format(lastResponse) : "None"}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  toggleButtonText: { fontSize: 20, color: "white" },
  debugOverlay: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 400,
    maxHeight: 600,
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  debugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  debugTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  currentTime: { fontSize: 11, color: "#6c757d", marginTop: 2 },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: { fontSize: 14, color: "#666" },
  debugContent: { flex: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fafafa",
  },
  pingButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: "center",
  },
  pingButtonText: { color: "white", fontSize: 12, fontWeight: "600" },
  navigationSection: { marginBottom: 16 },
  currentRouteDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  currentRouteLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#495057",
    marginRight: 8,
  },
  currentRouteValue: {
    fontSize: 10,
    color: "#007AFF",
    fontFamily: "monospace",
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  routeSelector: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeDropdown: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  routeDropdownText: { fontSize: 14, color: "#333" },
  dropdownArrow: { fontSize: 12, color: "#666" },
  dropdownMenu: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginTop: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: { fontSize: 14, color: "#333" },
  dropdownItemTextSelected: { color: "#007AFF", fontWeight: "600" },
  navigateButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  navigateButtonText: { color: "white", fontSize: 12, fontWeight: "600" },
  appInfoSection: { marginBottom: 16 },
  appInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  expandButton: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  appInfoContent: {
    marginTop: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  keyValueRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  keyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#495057",
    minWidth: 120,
    marginRight: 8,
  },
  valueText: {
    fontSize: 11,
    color: "#6c757d",
    fontFamily: "monospace",
    flex: 1,
  },
  tokenSection: { marginBottom: 16 },
  tokenInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  tokenTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fafafa",
    minHeight: 40,
  },
  tokenTextInputModified: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  saveTokenButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: "center",
  },
  saveTokenButtonActive: { backgroundColor: "#007AFF" },
  saveTokenButtonInactive: { backgroundColor: "#6c757d" },
  saveTokenButtonText: { fontSize: 12, fontWeight: "600" },
  saveTokenButtonTextActive: { color: "white" },
  saveTokenButtonTextInactive: { color: "#adb5bd" },
  storedTokenContainer: {
    backgroundColor: "#e8f5e8",
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: "#c3e6c3",
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  storedTokenLabel: { fontSize: 11, fontWeight: "600", color: "#155724" },
  tokenStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
  },
  tokenTypeText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 2,
  },
  tokenStatusText: { fontSize: 9, fontWeight: "600" },
  tokenStatusValid: { color: "#155724" },
  tokenStatusInvalid: { color: "#721c24" },
  storedTokenText: {
    fontSize: 10,
    color: "#155724",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  tokenTimestamp: {
    fontSize: 9,
    color: "#6c757d",
    fontStyle: "italic",
    marginBottom: 8,
  },
  tokenActionButtons: { flexDirection: "row", gap: 8 },
  sendTokenButton: {
    backgroundColor: "#fd7e14",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sendTokenButtonText: { color: "white", fontSize: 10, fontWeight: "600" },
  clearTokenButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearTokenButtonText: { color: "white", fontSize: 10, fontWeight: "600" },
  noTokenText: {
    fontSize: 11,
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: "#e9ecef", marginVertical: 16 },
  responseContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  responseLabel: { fontSize: 12, fontWeight: "600", color: "#495057" },
  responseText: { fontSize: 11, color: "#6c757d", fontFamily: "monospace" },
  clearResponseButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearResponseButtonText: { color: "white", fontSize: 10, fontWeight: "600" },
});
