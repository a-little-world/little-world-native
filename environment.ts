export interface Environment {
  backendUrl: string;
  coreWsPath: string;
  isNative: boolean;
  csrfBypassToken: string;
  allowNgrokRequests: boolean;
}

export const environment: Environment = {
  backendUrl: 'http://localhost:8000',
  coreWsPath: '/api/core/ws',
  isNative: true,
  csrfBypassToken: 'abc',
  allowNgrokRequests: false,
};
