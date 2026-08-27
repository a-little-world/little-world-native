import { requireOptionalNativeModule } from 'expo';

type CallAudioNativeModule = {
  start(): Promise<void>;
  stop(): Promise<void>;
  getDebugState(): Promise<Record<string, unknown>>;
};

// Android-only: iOS has no equivalent to setVolumeControlStream, WebKit owns AVAudioSession.
const native = requireOptionalNativeModule<CallAudioNativeModule>('CallAudio');

export const CallAudio = {
  start: () => native?.start().catch(() => {}) ?? Promise.resolve(),
  stop: () => native?.stop().catch(() => {}) ?? Promise.resolve(),
  getDebugState: async () => (await native?.getDebugState()) ?? null,
};
