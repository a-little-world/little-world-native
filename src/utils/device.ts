import * as SecureStore from "expo-secure-store";
import uuid from "react-native-uuid";

const DEVICE_ID_KEY = "device_id";

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = uuid.v4();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}
