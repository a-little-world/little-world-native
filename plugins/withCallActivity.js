const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

/**
 * Seeds showWhenLocked/turnScreenOn on MainActivity.
 *
 * This is only the INITIAL value. A cold full-screen-intent launch creates the
 * activity before any JS runs, so the ring cannot draw over the keyguard without
 * it - but leaving it raised means the app bypasses the lock screen entirely.
 * `modules/lock-screen` owns the flag from the first JS tick and lowers it
 * whenever no call is ringing. Do not remove one half without the other.
 */
const withCallActivity = config =>
  withAndroidManifest(config, androidConfig => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      androidConfig.modResults,
    );

    mainActivity.$['android:showWhenLocked'] = 'true';
    mainActivity.$['android:turnScreenOn'] = 'true';

    return androidConfig;
  });

module.exports = withCallActivity;
