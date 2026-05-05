export interface Environment {
  defaultLoginName: string;
  defaultLoginPassword: string;
  backendUrl: string;
  coreWsPath: string;
  isNative: boolean;
  csrfBypassToken: string;
  allowNgrokRequests: boolean;
}

export const environment: Environment = {
  defaultLoginName: 'benjamin.tim@gmx.de',
  defaultLoginPassword: 'Test123',
  backendUrl: 'https://little-world.com',
  coreWsPath: '/api/core/ws',
  isNative: true,
  csrfBypassToken: 'abc',
  allowNgrokRequests: false,
};
