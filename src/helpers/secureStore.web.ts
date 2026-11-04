// NOT SECURE: localStorage, web dev builds only
const PREFIX = 'dev_secure_';

export async function getItemAsync(key: string): Promise<string | null> {
  return localStorage.getItem(PREFIX + key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  localStorage.setItem(PREFIX + key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  localStorage.removeItem(PREFIX + key);
}
