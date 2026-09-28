package expo.modules.callaudio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android-only. Does two things while a call is active:
 *  - adopt a headset connected mid-call at the OS layer (the WebView won't re-route itself),
 *  - expose the AudioManager mode and active playback usages, so the call UI can verify the
 *    WebView actually routed remote audio through the communication stream.
 *
 * It deliberately does not touch volumeControlStream: the framework already points the volume
 * keys at the stream implied by AudioManager.mode.
 */
class CallAudioModule : Module() {

  @Volatile private var active = false
  private var deviceCallback: AudioDeviceCallback? = null

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "No react context" }

  private val audioManager: AudioManager
    get() = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  override fun definition() = ModuleDefinition {
    Name("CallAudio")

    AsyncFunction("start") {
      if (!active) {
        active = true
        registerDeviceCallback()
      }
    }

    AsyncFunction("stop") {
      if (active) {
        active = false
        unregisterDeviceCallback()
      }
    }

    AsyncFunction("getAudioState") { audioState() }
    AsyncFunction("getDebugState") { debugState() }

    OnDestroy {
      if (active) {
        active = false
        unregisterDeviceCallback()
      }
    }
  }

  private fun registerDeviceCallback() {
    val cb = object : AudioDeviceCallback() {
      override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        if (active) {
          addedDevices
            ?.firstOrNull { it.isSink && isHeadsetRoute(it) }
            ?.let { adoptCommunicationDevice(it) }
        }
      }
    }
    deviceCallback = cb
    audioManager.registerAudioDeviceCallback(cb, null)
  }

  private fun unregisterDeviceCallback() {
    deviceCallback?.let { audioManager.unregisterAudioDeviceCallback(it) }
    deviceCallback = null
  }

  // The WebView won't re-route an already-running call itself, so adopt a headset that
  // connects mid-call at the OS layer. No-op if none was added.
  private fun adoptCommunicationDevice(device: AudioDeviceInfo) {
    val am = audioManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      if (!am.setCommunicationDevice(device)) {
        Log.w("CallAudio", "setCommunicationDevice rejected type=${device.type}")
      }
    } else {
      @Suppress("DEPRECATION")
      if (device.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
        am.startBluetoothSco()
        am.isBluetoothScoOn = true
      }
    }
  }

  private fun isHeadsetRoute(device: AudioDeviceInfo): Boolean = when (device.type) {
    AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
    AudioDeviceInfo.TYPE_BLE_HEADSET,
    AudioDeviceInfo.TYPE_WIRED_HEADSET,
    AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> true
    else -> false
  }

  private fun audioState(): Map<String, Any?> = mapOf(
    "active" to active,
    "mode" to audioManager.mode,
    "modeName" to modeName(audioManager.mode),
    "usages" to activePlaybackUsages()
  )

  private fun activePlaybackUsages(): List<Int> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return emptyList()
    return audioManager.activePlaybackConfigurations.map { it.audioAttributes.usage }
  }

  private fun debugState(): Map<String, Any?> {
    val am = audioManager
    @Suppress("DEPRECATION")
    return mapOf(
      "active" to active,
      "mode" to am.mode,
      "modeName" to modeName(am.mode),
      "isBluetoothScoOn" to am.isBluetoothScoOn,
      "isSpeakerphoneOn" to am.isSpeakerphoneOn,
      "communicationDeviceType" to
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) am.communicationDevice?.type else null,
      "communicationDeviceTypeName" to
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) am.communicationDevice?.type?.let { deviceTypeName(it) } else null,
      "musicVolume" to am.getStreamVolume(AudioManager.STREAM_MUSIC),
      "voiceCallVolume" to am.getStreamVolume(AudioManager.STREAM_VOICE_CALL),
      "outputDevices" to am.getDevices(AudioManager.GET_DEVICES_OUTPUTS).map { device ->
        mapOf(
          "id" to device.id,
          "type" to device.type,
          "typeName" to deviceTypeName(device.type),
          "isSink" to device.isSink
        )
      },
      "activePlayback" to activePlayback()
    )
  }

  private fun activePlayback(): List<Map<String, Any?>> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return emptyList()
    return audioManager.activePlaybackConfigurations.map { cfg ->
      val attrs: AudioAttributes = cfg.audioAttributes
      mapOf(
        "usage" to attrs.usage,
        "usageName" to usageName(attrs.usage),
        "contentType" to attrs.contentType
      )
    }
  }

  private fun modeName(mode: Int): String = when (mode) {
    AudioManager.MODE_NORMAL -> "NORMAL"
    AudioManager.MODE_RINGTONE -> "RINGTONE"
    AudioManager.MODE_IN_CALL -> "IN_CALL"
    AudioManager.MODE_IN_COMMUNICATION -> "IN_COMMUNICATION"
    else -> "UNKNOWN"
  }

  private fun usageName(usage: Int): String = when (usage) {
    AudioAttributes.USAGE_MEDIA -> "MEDIA"
    AudioAttributes.USAGE_VOICE_COMMUNICATION -> "VOICE_COMMUNICATION"
    AudioAttributes.USAGE_VOICE_COMMUNICATION_SIGNALLING -> "VOICE_COMMUNICATION_SIGNALLING"
    AudioAttributes.USAGE_NOTIFICATION -> "NOTIFICATION"
    AudioAttributes.USAGE_NOTIFICATION_RINGTONE -> "NOTIFICATION_RINGTONE"
    AudioAttributes.USAGE_UNKNOWN -> "UNKNOWN"
    else -> "OTHER($usage)"
  }

  private fun deviceTypeName(type: Int): String = when (type) {
    AudioDeviceInfo.TYPE_BUILTIN_EARPIECE -> "BUILTIN_EARPIECE"
    AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> "BUILTIN_SPEAKER"
    AudioDeviceInfo.TYPE_WIRED_HEADSET -> "WIRED_HEADSET"
    AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "WIRED_HEADPHONES"
    AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "BLUETOOTH_SCO"
    AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "BLUETOOTH_A2DP"
    AudioDeviceInfo.TYPE_USB_DEVICE -> "USB_DEVICE"
    AudioDeviceInfo.TYPE_USB_HEADSET -> "USB_HEADSET"
    AudioDeviceInfo.TYPE_HEARING_AID -> "HEARING_AID"
    AudioDeviceInfo.TYPE_BLE_HEADSET -> "BLE_HEADSET"
    AudioDeviceInfo.TYPE_BLE_SPEAKER -> "BLE_SPEAKER"
    else -> "TYPE($type)"
  }
}
