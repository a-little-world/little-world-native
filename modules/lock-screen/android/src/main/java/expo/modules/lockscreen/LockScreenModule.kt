package expo.modules.lockscreen

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LockScreenModule : Module() {
  // Application context, not the activity: this is also read from the headless
  // background handler, where there is no activity.
  private val keyguardManager: KeyguardManager?
    get() = appContext.reactContext?.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager

  override fun definition() = ModuleDefinition {
    Name("LockScreen")

    Function("isKeyguardLocked") {
      keyguardManager?.isKeyguardLocked ?: false
    }

    Function("showOverLockScreen") {
      setLockScreenFlags(true)
    }

    Function("hideOverLockScreen") {
      setLockScreenFlags(false)
      // Clearing the flag does not reliably re-occlude an already visible
      // activity, so send the task back as well.
      if (keyguardManager?.isKeyguardLocked == true) {
        withActivity { it.moveTaskToBack(true) }
      }
    }
  }

  private fun setLockScreenFlags(show: Boolean) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1) {
      return
    }
    withActivity {
      it.setShowWhenLocked(show)
      it.setTurnScreenOn(show)
    }
  }

  private fun withActivity(block: (Activity) -> Unit) {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread { block(activity) }
  }
}
