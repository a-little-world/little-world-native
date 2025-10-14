import { environment } from "../config/environment";
import * as AppIntegrity from '@expo/app-integrity';
import { Platform } from 'react-native';

export async function requestIntegrityCheck() {
    const requestHash = `native-secret-${Date.now()}-${Math.random()}`;
    if (Platform.OS === 'web') {
        return { integrityToken: "bypass", requestHash: requestHash };
    }

    const cloudProjectNumber = environment.googleCloudProjectNumber;
    await AppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
    const integrityToken = await AppIntegrity.requestIntegrityCheck(requestHash);

    return { integrityToken, requestHash };
}