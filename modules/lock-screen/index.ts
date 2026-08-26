import { Platform } from 'react-native';

import { requireOptionalNativeModule } from 'expo';

/**
 * Control over whether the app may draw above the keyguard.
 *
 * `android:showWhenLocked` is declared on MainActivity so that a cold
 * full-screen-intent launch can draw over the lock screen before any JS runs.
 * That is only the initial value - from the first JS tick this module owns it,
 * and it must be raised only while a call is ringing or in progress. Leaving it
 * raised means the app bypasses the lock screen entirely.
 */
type LockScreenModule = {
  isKeyguardLocked(): boolean;
  showOverLockScreen(): void;
  hideOverLockScreen(): void;
};

const native =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<LockScreenModule>('LockScreen')
    : null;

export function isKeyguardLocked(): boolean {
  return native?.isKeyguardLocked() ?? false;
}

export function showOverLockScreen(): void {
  native?.showOverLockScreen();
}

/** Lowers the flag and, if the device is locked, returns to the keyguard. */
export function hideOverLockScreen(): void {
  native?.hideOverLockScreen();
}
