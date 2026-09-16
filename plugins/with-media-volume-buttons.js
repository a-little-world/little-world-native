const { withMainActivity } = require('expo/config-plugins');

// Calls run in the WebView, so LiveKit plays remote audio through an <audio>
// element -> Android's MUSIC stream. Capturing the mic puts the phone in
// communication mode, which points the hardware volume buttons at the VOICE_CALL
// stream instead. Result: users turn the volume up and nothing gets louder.
// Pin the buttons to the stream that actually plays.
const patchMainActivity = contents => {
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
      throw new Error(`with-media-volume-buttons: anchor not found: ${anchor}`);
    }
    return acc.replace(anchor, replacement);
  }, contents);
};

module.exports = config =>
  withMainActivity(config, config => {
    if (config.modResults.language !== 'kt') {
      throw new Error(
        'with-media-volume-buttons: expected a Kotlin MainActivity',
      );
    }
    config.modResults.contents = patchMainActivity(config.modResults.contents);
    return config;
  });

module.exports.patchMainActivity = patchMainActivity;
