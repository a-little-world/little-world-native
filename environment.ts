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
  allowNgrokRequests: boolean;
}

export const environment: Environment = {
  development: false,
  production: true,
  defaultLoginName: 'benjamin.tim@gmx.de',
  defaultLoginPassword: 'Test123',
  backendUrl: 'https://stage.little-world.com',
  backendPath: '',
  coreWsScheme: 'wss://',
  coreWsPath: '/api/core/ws',
  websocketHost: 'stage.little-world.com',
  isNative: true,
  csrfBypassToken: 'abc',
  allowNgrokRequests: true,
};
