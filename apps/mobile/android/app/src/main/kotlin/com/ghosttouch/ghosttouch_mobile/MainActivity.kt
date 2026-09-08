package com.ghosttouch.ghosttouch_mobile

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.LocationManager
import android.location.Location
import android.location.LocationListener
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.ghosttouch.ghosttouch_mobile.services.TouchService
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.net.Inet4Address
import java.net.NetworkInterface

class MainActivity : FlutterActivity() {
    private val channelName = "com.ghosttouch/native"
    private val locationRequest = 4012
    private var permissionResult: MethodChannel.Result? = null
    private var currentLocation: Location? = null
    private val locationListener = LocationListener { location -> currentLocation = location }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName).setMethodCallHandler { call, result ->
            when (call.method) {
                "injectTouch" -> {
                    val action = call.argument<String>("action")
                    val x = call.argument<Double>("x")?.toFloat()
                    val y = call.argument<Double>("y")?.toFloat()
                    if (x == null || y == null || action == null) result.error("INVALID_ARGS", "Missing touch data", null)
                    else result.success(TouchService.instance?.injectTouch(action, x, y) ?: false)
                }
                "systemAction" -> result.success(TouchService.instance?.performSystemAction(call.argument<String>("action") ?: "") ?: false)
                "openAccessibilitySettings" -> { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); result.success(null) }
                "requestLocationPermission" -> requestLocationPermission(result)
                "getDeviceSnapshot" -> result.success(deviceSnapshot())
                "getLocation" -> result.success(lastLocation())
                else -> result.notImplemented()
            }
        }
    }

    private fun requestLocationPermission(result: MethodChannel.Result) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            startLocationUpdates(); result.success(true); return
        }
        permissionResult = result
        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), locationRequest)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == locationRequest) {
            val granted = grantResults.any { it == PackageManager.PERMISSION_GRANTED }
            if (granted) startLocationUpdates()
            permissionResult?.success(granted)
            permissionResult = null
        }
    }

    private fun deviceSnapshot(): Map<String, Any?> {
        val battery = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = battery?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = battery?.getIntExtra(BatteryManager.EXTRA_SCALE, 100) ?: 100
        val status = battery?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val metrics = resources.displayMetrics
        return mapOf(
            "batteryLevel" to if (level >= 0) (level * 100 / scale) else 0,
            "isCharging" to (status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL),
            "networkType" to networkType(), "nativeWidth" to metrics.widthPixels, "nativeHeight" to metrics.heightPixels,
            "deviceName" to "${Build.MANUFACTURER} ${Build.MODEL}", "manufacturer" to Build.MANUFACTURER,
            "model" to Build.MODEL, "androidVersion" to Build.VERSION.RELEASE, "localIp" to localIp(),
            "accessibilityEnabled" to (TouchService.instance != null)
        )
    }

    private fun networkType(): String {
        val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val capabilities = manager.getNetworkCapabilities(manager.activeNetwork) ?: return "NONE"
        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WIFI"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "CELLULAR"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ETHERNET"
            else -> "UNKNOWN"
        }
    }

    private fun localIp(): String? = try {
        NetworkInterface.getNetworkInterfaces().toList().flatMap { it.inetAddresses.toList() }
            .firstOrNull { !it.isLoopbackAddress && it is Inet4Address }?.hostAddress
    } catch (_: Exception) { null }

    private fun lastLocation(): Map<String, Any?>? {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return null
        val manager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val location = currentLocation ?: manager.getProviders(true).mapNotNull { provider ->
            try { manager.getLastKnownLocation(provider) } catch (_: SecurityException) { null }
        }.maxByOrNull { it.time } ?: return null
        return mapOf("latitude" to location.latitude, "longitude" to location.longitude, "accuracy" to location.accuracy,
            "altitude" to location.altitude, "speed" to location.speed, "timestamp" to location.time)
    }

    private fun startLocationUpdates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return
        val manager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        manager.getProviders(true).forEach { provider ->
            try { manager.requestLocationUpdates(provider, 3000L, 2f, locationListener) } catch (_: Exception) { }
        }
    }

    override fun onDestroy() {
        val manager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        try { manager.removeUpdates(locationListener) } catch (_: Exception) { }
        super.onDestroy()
    }
}
