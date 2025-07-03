import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import {
  Button,
  Text,
  Card,
} from "@a-little-world/little-world-design-system-native";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, router } from "expo-router";
import { getCallSetupStyles } from "./CallSetup.styles";
import { SafeAreaView } from "react-native-safe-area-context";
import { ButtonSizes } from "@a-little-world/little-world-design-system-core";

// LiveKit imports (only when available)
let PreJoin: any = null;
let LocalUserChoices: any = null;

// try {
//   const livekitComponents = require('@livekit/components-react');
//   PreJoin = livekitComponents.PreJoin;
//   LocalUserChoices = livekitComponents.LocalUserChoices;
// } catch (error) {
//   console.log('LiveKit components not available');
// }

type CallSetupProps = {
  onClose?: () => void;
  userPk?: string;
};

function CallSetup({ onClose, userPk }: CallSetupProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const styles = getCallSetupStyles(theme);

  const [authData, setAuthData] = useState({
    token: null,
    livekitServerUrl: null,
  });
  const [error, setError] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const handleJoin = useCallback(() => {
    if (onClose) {
      onClose();
    }
    router.push(`/call/${id || "123"}`);
  }, [onClose, id]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose]);

  useEffect(() => {
    // Request the video room access token
    console.log("Requesting video access token for user:", userPk || id);
    // TODO: Implement actual token request
  }, [userPk, id]);

  const handleError = useCallback(() => {
    setError("error.permissions");
  }, []);

  const handleValidate = useCallback(() => {
    const isValid = Boolean(audioEnabled || videoEnabled);
    if (isValid) setError("");
    return isValid;
  }, [audioEnabled, videoEnabled]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled((prev) => !prev);
  }, []);

  // Memoize the validation result to prevent infinite re-renders
  const isValid = useMemo(() => {
    return Boolean(audioEnabled || videoEnabled);
  }, [audioEnabled, videoEnabled]);

  // // If LiveKit PreJoin is available, use it
  // if (PreJoin && LocalUserChoices) {
  //   return (
  //     <View style={styles.container}>
  //       <Card style={styles.card}>
  //         <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
  //           <Text>✕</Text>
  //         </TouchableOpacity>

  //         <View style={styles.preJoinContainer}>
  //           <PreJoin
  //             onSubmit={handleJoin}
  //             camLabel={t('pcs_camera_label', 'Camera')}
  //             micLabel={t('pcs_mic_label', 'Microphone')}
  //             joinLabel={t('pcs_btn_join_call', 'Join Call')}
  //             onError={handleError}
  //             onValidate={handleValidate}
  //             defaults={{ username: 'Frank M.' }}
  //             persistUserChoices={false}
  //           />
  //         </View>

  //         {error && (
  //           <View style={styles.errorContainer}>
  //             <Text style={styles.errorText}>{t(error)}</Text>
  //           </View>
  //         )}
  //       </Card>
  //     </View>
  //   );
  // }

  // Fallback implementation without LiveKit PreJoin
  return (
    <SafeAreaView style={styles.container}>
      <Card style={styles.card}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {t("pcs_main_heading", "Join Video Call")}
          </Text>
          <Text style={styles.subtitle}>
            {t("pcs_sub_heading", "Test your audio and video before joining")}
          </Text>
        </View>

        <View style={styles.preJoinContainer}>
          <View style={styles.videoContainer}>
            <Text>Video Preview</Text>
            <Text>Camera: {videoEnabled ? "On" : "Off"}</Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: audioEnabled ? "#4CAF50" : "#FF5722" },
              ]}
              onPress={toggleAudio}
            >
              <Text>{audioEnabled ? "🎤" : "🔇"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: videoEnabled ? "#4CAF50" : "#FF5722" },
              ]}
              onPress={toggleVideo}
            >
              <Text>{videoEnabled ? "📹" : "🚫"}</Text>
            </TouchableOpacity>
          </View>

          <Button
            style={[{ opacity: isValid ? 1 : 0.5 }]}
            onPress={handleJoin}
            disabled={!isValid}
            size={ButtonSizes.Large}
          >
            {t("pcs_btn_join_call", "Join Call")}
          </Button>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t(error)}</Text>
          </View>
        )}
      </Card>
    </SafeAreaView>
  );
}

export default CallSetup;
