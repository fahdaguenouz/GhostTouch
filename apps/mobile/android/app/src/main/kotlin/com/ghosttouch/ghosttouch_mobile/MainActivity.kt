package com.ghosttouch.ghosttouch_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.ghosttouch.ghosttouch_mobile.services.TouchService

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.ghosttouch/native"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "injectTouch") {
                val action = call.argument<String>("action")
                val x = call.argument<Double>("x")?.toFloat()
                val y = call.argument<Double>("y")?.toFloat()

                if (x != null && y != null && action != null) {
                    TouchService.instance?.injectTouch(action, x, y)
                    result.success(true)
                } else {
                    result.error("INVALID_ARGS", "Missing coordinates or action", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
