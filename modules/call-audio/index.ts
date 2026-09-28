import { requireOptionalNativeModule } from 'expo';

// Android AudioAttributes usage values
export const USAGE = {
  UNKNOWN: 0,
  MEDIA: 1,
  VOICE_COMMUNICATION: 2,
  VOICE_COMMUNICATION_SIGNALLING: 3,
  ALARM: 4,
  NOTIFICATION: 5,
  NOTIFICATION_RINGTONE: 6,
  GAME: 14,
} as const;

// Android AudioManager modes
export const MODE = {
  NORMAL: 0,
  RINGTONE: 1,
  IN_CALL: 2,
  IN_COMMUNICATION: 3,
} as const;

export interface OutputDevice {
  id: number;
  type: number;
  typeName: string;
  isSink: boolean;
}

export interface ActivePlayback {
  usage: number;
  usageName: string;
  contentType: number;
}

// Lightweight snapshot used to gate the call UI on the audio route.
export type CallAudioState = {
  active: boolean;
  mode: number;
  modeName: string;
  usages: number[];
};

export type CallAudioDebugState = {
  active: boolean;
  mode: number;
  modeName: string;
  isBluetoothScoOn: boolean;
  isSpeakerphoneOn: boolean;
  communicationDeviceType: number | null;
  communicationDeviceTypeName: string | null;
  musicVolume: number;
  voiceCallVolume: number;
  outputDevices: OutputDevice[];
  activePlayback: ActivePlayback[];
};

type CallAudioNativeModule = {
  start(): Promise<void>;
  stop(): Promise<void>;
  getAudioState(): Promise<CallAudioState>;
  getDebugState(): Promise<CallAudioDebugState>;
};

// Android-only: iOS has no equivalent to setVolumeControlStream, WebKit owns AVAudioSession.
const native = requireOptionalNativeModule<CallAudioNativeModule>('CallAudio');

const noop = () => Promise.resolve();

export const CallAudio = {
  start: () => native?.start().catch(() => {}) ?? noop(),
  stop: () => native?.stop().catch(() => {}) ?? noop(),

  getAudioState: async (): Promise<CallAudioState | null> =>
    (await native?.getAudioState().catch(() => null)) ?? null,
  getDebugState: async (): Promise<CallAudioDebugState | null> =>
    (await native?.getDebugState().catch(() => null)) ?? null,
};
