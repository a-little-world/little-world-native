// src/messaging/types.ts
export type NativeMessage =
  | { type: 'PING' }
  | { type: 'SET_LOCALE'; locale: string }
  | { type: 'SET_USER'; user: { id: string; name: string } | null };

export type NativeResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

export type DomMessage =
  | { type: 'OPEN_ITEM'; id: string }
  | { type: 'REPORT_HEIGHT'; height: number };

export type DomResponse = NativeResponse;