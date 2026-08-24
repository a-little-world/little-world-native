const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

/**
 * Adds showWhenLocked/turnScreenOn to MainActivity so the incoming-call
 * full-screen intent can wake the device and draw over the lock screen.
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
