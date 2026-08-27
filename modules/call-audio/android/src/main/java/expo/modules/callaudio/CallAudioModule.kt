package expo.modules.callaudio

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors

class CallAudioModule : Module() {

  @Volatile private var active = false
  private var previousStream: Int? = null

  private val executor = Executors.newSingleThreadExecutor()
  private var deviceCallback: AudioDeviceCallback? = null
  private var scoReceiver: BroadcastReceiver? = null
  private var commDeviceListener: AudioManager.OnCommunicationDeviceChangedListener? = null

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "No react context" }

  private val audioManager: AudioManager
    get() = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  override fun definition() = ModuleDefinition {
    Name("CallAudio")

    AsyncFunction("start") {
      if (!active) {
        active = true
        registerRouteListeners()
        applyResolvedStream()
      }
    }

    AsyncFunction("stop") {
      if (active) {
        active = false
        unregisterRouteListeners()
        restoreStream()
      }
    }

    AsyncFunction("getDebugState") { debugState() }

    // volumeControlStream is per-Activity and is lost on recreation
    OnActivityEntersForeground {
      if (active) applyResolvedStream()
    }

    OnDestroy {
      if (active) {
        active = false
        unregisterRouteListeners()
        restoreStream()
      }
      executor.shutdown()
    }
  }

  /**
   * SCO/HFP and hearing-aid routes carry audio on the voice-call stream.
   * Everything else (speaker, earpiece, wired, A2DP) means the WebView's media
   * output is on STREAM_MUSIC.
   */
  private fun resolveStream(): Int {
    val am = audioManager
    val onVoiceRoute = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      when (am.communicationDevice?.type) {
        AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
        AudioDeviceInfo.TYPE_BLE_HEADSET,
        AudioDeviceInfo.TYPE_HEARING_AID -> true
        else -> false
      }
    } else {
      @Suppress("DEPRECATION")
      am.isBluetoothScoOn
    }
    return if (onVoiceRoute) AudioManager.STREAM_VOICE_CALL else AudioManager.STREAM_MUSIC
  }

  private fun applyResolvedStream() {
    val activity = appContext.activityProvider?.currentActivity ?: return
    val target = resolveStream()
    activity.runOnUiThread {
      if (previousStream == null) previousStream = activity.volumeControlStream
      if (activity.volumeControlStream != target) {
        activity.volumeControlStream = target
        Log.i("CallAudio", "volumeControlStream -> $target, state=${debugState()}")
      }
    }
  }

  private fun restoreStream() {
    val activity = appContext.activityProvider?.currentActivity ?: return
    val prev = previousStream ?: AudioManager.USE_DEFAULT_STREAM_TYPE
    previousStream = null
    activity.runOnUiThread { activity.volumeControlStream = prev }
  }

  private fun registerRouteListeners() {
    val am = audioManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val listener = AudioManager.OnCommunicationDeviceChangedListener {
        if (active) applyResolvedStream()
      }
      commDeviceListener = listener
      am.addOnCommunicationDeviceChangedListener(executor, listener)
    } else {
      val receiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, i: Intent?) {
          if (active) applyResolvedStream()
        }
      }
      scoReceiver = receiver
      @Suppress("DEPRECATION")
      context.registerReceiver(
        receiver,
        IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)
      )
    }

    val cb = object : AudioDeviceCallback() {
      override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        if (active) applyResolvedStream()
      }
      override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
        if (active) applyResolvedStream()
      }
    }
    deviceCallback = cb
    am.registerAudioDeviceCallback(cb, null)
  }

  private fun unregisterRouteListeners() {
    val am = audioManager
    deviceCallback?.let { am.unregisterAudioDeviceCallback(it) }
    deviceCallback = null

    commDeviceListener?.let {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        am.removeOnCommunicationDeviceChangedListener(it)
      }
    }
    commDeviceListener = null

    scoReceiver?.let { runCatching { context.unregisterReceiver(it) } }
    scoReceiver = null
  }

  private fun debugState(): Map<String, Any?> {
    val am = audioManager
    @Suppress("DEPRECATION")
    return mapOf(
      "mode" to am.mode,
      "isBluetoothScoOn" to am.isBluetoothScoOn,
      "isSpeakerphoneOn" to am.isSpeakerphoneOn,
      "communicationDeviceType" to
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) am.communicationDevice?.type else null,
      "volumeControlStream" to appContext.activityProvider?.currentActivity?.volumeControlStream,
      "resolvedStream" to resolveStream(),
      "musicVolume" to am.getStreamVolume(AudioManager.STREAM_MUSIC),
      "musicMax" to am.getStreamMaxVolume(AudioManager.STREAM_MUSIC),
      "voiceCallVolume" to am.getStreamVolume(AudioManager.STREAM_VOICE_CALL),
      "voiceCallMax" to am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
    )
  }
}
