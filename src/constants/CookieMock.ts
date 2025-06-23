// TODO: implement for native!
export const Cookies = {
  get: (name: string) => {
    return '';
  },
  set: (name: string, value: string, options?: {
    expires?: Date | number | string;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
    maxAge?: number;
  }) => {
    return;
  }
};