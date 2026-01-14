export interface Environment {
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
  production: false,
  defaultLoginName: 'benjamin.tim@gmx.de',
  defaultLoginPassword: 'Test123',
  backendUrl: 'http://localhost:8000',
  backendPath: '',
  coreWsScheme: 'ws://',
  coreWsPath: '/api/core/ws',
  websocketHost: 'localhost:8000',
  isNative: true,
  csrfBypassToken: 'abc',
  allowNgrokRequests: false,
};
