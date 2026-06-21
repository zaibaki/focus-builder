package expo.modules.appblocker

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Process
import android.provider.Settings
import android.util.Base64
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class ExpoAppBlockerModule : Module() {
  private var monitoringThread: Thread? = null
  private var isMonitoring = false
  private var blockedPackagesList = listOf<String>()

  override fun definition() = ModuleDefinition {
    Name("ExpoAppBlocker")

    Events("onAppBlocked")

    Function("isSupported") {
      return@Function true
    }

    Function("hasUsageAccessPermission") {
      return@Function hasUsageAccessPermission()
    }

    Function("requestUsageAccessPermission") {
      requestUsageAccessPermission()
    }

    Function("hasSystemAlertWindowPermission") {
      return@Function hasSystemAlertWindowPermission()
    }

    Function("requestSystemAlertWindowPermission") {
      requestSystemAlertWindowPermission()
    }

    Function("getInstalledApps") {
      return@Function getInstalledApps()
    }

    Function("startBlocking") { packages: List<String> ->
      startBlocking(packages)
    }

    Function("stopBlocking") {
      stopBlocking()
    }
  }

  private fun hasUsageAccessPermission(): Boolean {
    val context = appContext.reactContext ?: return false
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      context.packageName
    )
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun requestUsageAccessPermission() {
    val context = appContext.reactContext ?: return
    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      data = Uri.fromParts("package", context.packageName, null)
    }
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      val fallbackIntent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(fallbackIntent)
    }
  }

  private fun hasSystemAlertWindowPermission(): Boolean {
    val context = appContext.reactContext ?: return false
    return Settings.canDrawOverlays(context)
  }

  private fun requestSystemAlertWindowPermission() {
    val context = appContext.reactContext ?: return
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:${context.packageName}")
    ).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      val fallbackIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(fallbackIntent)
    }
  }

  private fun getInstalledApps(): List<Map<String, String>> {
    val context = appContext.reactContext ?: return emptyList()
    val pm = context.packageManager
    val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
      addCategory(Intent.CATEGORY_LAUNCHER)
    }
    val launchables = pm.queryIntentActivities(mainIntent, 0)
    val result = mutableListOf<Map<String, String>>()

    for (info in launchables) {
      val packageName = info.activityInfo.packageName
      if (packageName == context.packageName) {
        continue
      }
      val displayName = info.loadLabel(pm).toString()
      val iconBase64 = getIconBase64(pm, info)
      result.add(mapOf(
        "packageName" to packageName,
        "displayName" to displayName,
        "icon" to iconBase64
      ))
    }
    result.sortBy { it["displayName"]?.lowercase() }
    return result
  }

  private fun getIconBase64(pm: PackageManager, info: android.content.pm.ResolveInfo): String {
    try {
      val drawable = info.loadIcon(pm) ?: return ""
      val bitmap = drawableToBitmap(drawable)
      val outputStream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      val byteArray = outputStream.toByteArray()
      return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
    } catch (e: Exception) {
      return ""
    }
  }

  private fun drawableToBitmap(drawable: Drawable): Bitmap {
    if (drawable is BitmapDrawable && drawable.bitmap != null) {
      return drawable.bitmap
    }
    val size = 96
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, size, size)
    drawable.draw(canvas)
    return bitmap
  }

  private fun startBlocking(packages: List<String>) {
    blockedPackagesList = packages
    if (isMonitoring) return
    isMonitoring = true
    monitoringThread = Thread {
      while (isMonitoring) {
        try {
          Thread.sleep(1000)
          val foregroundPackage = getForegroundApp()
          if (foregroundPackage != null && blockedPackagesList.contains(foregroundPackage)) {
            bringFocusAppToForeground()
            sendEvent("onAppBlocked", bundleOf(
              "packageName" to foregroundPackage
            ))
          }
        } catch (e: InterruptedException) {
          break
        } catch (e: Exception) {
          // Ignore
        }
      }
    }.apply {
      isDaemon = true
      start()
    }
  }

  private fun stopBlocking() {
    isMonitoring = false
    monitoringThread?.interrupt()
    monitoringThread = null
  }

  private fun getForegroundApp(): String? {
    val context = appContext.reactContext ?: return null
    val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
    val endTime = System.currentTimeMillis()
    val startTime = endTime - 10000 // look back 10 seconds

    val events = usageStatsManager.queryEvents(startTime, endTime)
    var foregroundPackage: String? = null
    val event = UsageEvents.Event()

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
        foregroundPackage = event.packageName
      }
    }
    return foregroundPackage
  }

  private fun bringFocusAppToForeground() {
    val context = appContext.reactContext ?: return
    val pm = context.packageManager
    val intent = pm.getLaunchIntentForPackage(context.packageName) ?: return
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    context.startActivity(intent)
  }
}
