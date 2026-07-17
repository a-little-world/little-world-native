export interface Environment {
  backendUrl: string;
  coreWsPath: string;
  isNative: boolean;
  csrfBypassToken: string;
  allowNgrokRequests: boolean;
}

export const environment: Environment = {
  // Overridable at build time (e.g. e2e web export against a local backend):
  //   EXPO_PUBLIC_BACKEND_URL=http://localhost:8000 pnpm export-web
  // Expo inlines EXPO_PUBLIC_* at build time; defaults to prod otherwise.
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  coreWsPath: '/api/core/ws',
  isNative: true,
  csrfBypassToken: 'abc',
  allowNgrokRequests: false,
};
