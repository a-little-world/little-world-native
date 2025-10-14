import { environment } from "../config/environment";
import * as AppIntegrity from '@expo/app-integrity';

// TODO: android only at the moment
export async function requestIntegrityCheck() {
    const cloudProjectNumber = environment.googleCloudProjectNumber;
    await AppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
    const requestHash = `native-secret-${Date.now()}-${Math.random()}`;
    const integrityToken = await AppIntegrity.requestIntegrityCheck(requestHash);

    return { integrityToken, requestHash };
}