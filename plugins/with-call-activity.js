const { withMainActivity } = require('expo/config-plugins');

// Calls run in the WebView, so LiveKit plays remote audio through an <audio>
// element -> Android's MUSIC stream. Capturing the mic puts the phone in
// communication mode, which points the hardware volume buttons at the VOICE_CALL
// stream instead. Result: users turn the volume up and nothing gets louder.
// Pin the buttons to the stream that actually plays.
function patchVolumeButtons(contents) {
  if (contents.includes('volumeControlStream')) return contents;

  const anchors = [
    ['import android.os.Build', 'import android.media.AudioManager\n$&'],
    [
      'super.onCreate(null)',
      '$&\n    volumeControlStream = AudioManager.STREAM_MUSIC',
    ],
  ];
  return anchors.reduce((acc, [anchor, replacement]) => {
    if (!acc.includes(anchor)) {
      throw new Error(`with-call-activity: anchor not found: ${anchor}`);
    }
    return acc.replace(anchor, replacement);
  }, contents);
}

// A full-screen-intent notification only actually draws over the lockscreen if
// the launched Activity opts in with showWhenLocked/turnScreenOn -- otherwise
// Android silently downgrades to a heads-up notification the user has to tap
// manually. notify-kit is only ever used for the incoming-call notification in
// this app, and it stamps this extra on every intent it launches an activity
// with (press action and full-screen action alike), so its presence is a safe
// proxy for "this launch is the incoming-call ring." A plain launcher tap
// carries neither extra, so the bypass is turned back off on any other launch
// rather than left on for the life of the process.
function patchLockscreenVisibility(contents) {
  if (contents.includes('applyLockscreenVisibility')) return contents;

  const anchors = [
    ['import android.os.Bundle', 'import android.content.Intent\n$&'],
    [
      'volumeControlStream = AudioManager.STREAM_MUSIC',
      '$&\n    applyLockscreenVisibility(intent)',
    ],
    [
      '  /**\n   * Returns the name of the main component',
      `  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    applyLockscreenVisibility(intent)
  }

  private fun applyLockscreenVisibility(intent: Intent?) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1) return
    val isCallLaunch = intent?.hasExtra("notifee.notification") == true
    setShowWhenLocked(isCallLaunch)
    setTurnScreenOn(isCallLaunch)
  }

$&`,
    ],
  ];
  return anchors.reduce((acc, [anchor, replacement]) => {
    if (!acc.includes(anchor)) {
      throw new Error(`with-call-activity: anchor not found: ${anchor}`);
    }
    return acc.replace(anchor, replacement);
  }, contents);
}

module.exports = config =>
  withMainActivity(config, config => {
    if (config.modResults.language !== 'kt') {
      throw new Error('with-call-activity: expected a Kotlin MainActivity');
    }
    config.modResults.contents = patchLockscreenVisibility(
      patchVolumeButtons(config.modResults.contents),
    );
    return config;
  });

module.exports.patchVolumeButtons = patchVolumeButtons;
module.exports.patchLockscreenVisibility = patchLockscreenVisibility;
