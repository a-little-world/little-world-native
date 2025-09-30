export interface Environment {
  development: boolean;
  production: boolean;
  defaultLoginName: string;
  defaultLoginPassword: string;
  backendUrl: string;
  backendPath: string;
  coreWsScheme: string;
  coreWsPath: string;
  websocketHost: string;
  isNative: boolean;
  csrfBypassToken: string;
}

export const environment: Environment = {
  development: false,
  production: true,
  defaultLoginName: "benjamin.tim@gmx.de",
  defaultLoginPassword: "Test123",
  backendUrl: "https://little-world.jannistoelle.de",
  // backendUrl: 'https://staging-native-mods-543.t1m.me',
  backendPath: "",
  coreWsScheme: "wss://",
  coreWsPath: "/api/core/ws",
  websocketHost: "",
  isNative: true,
  csrfBypassToken: "abc",
};
