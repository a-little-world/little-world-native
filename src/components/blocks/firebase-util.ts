import { apiFetch } from "@/src/api/helpers";

export async function registerFirebaseDeviceToken(
  token: string
): Promise<void> {
  return apiFetch("/api/push_notifications/register", {
    method: "POST",
    body: {
      token,
    },
  });
}

export async function unregisterFirebaseDeviceToken(
  token: string
): Promise<void> {
  return apiFetch("/api/push_notifications/unregister", {
    method: "POST",
    body: {
      token,
    },
  });
}
