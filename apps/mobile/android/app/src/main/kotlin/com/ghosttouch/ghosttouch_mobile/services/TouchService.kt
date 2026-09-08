package com.ghosttouch.ghosttouch_mobile.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class TouchService : AccessibilityService() {

    companion object {
        var instance: TouchService? = null
    }
    private var activePath: Path? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i("TouchService", "GhostTouch Accessibility Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {
        Log.w("TouchService", "GhostTouch Accessibility Service Interrupted")
    }

    override fun onUnbind(intent: Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }

    fun injectTouch(action: String, x: Float, y: Float): Boolean {
        if (x < 0 || y < 0 || x > resources.displayMetrics.widthPixels || y > resources.displayMetrics.heightPixels) return false
        if (action == "DOWN") {
            activePath = Path().apply { moveTo(x, y) }
            return true
        }
        if (action == "MOVE") {
            activePath?.lineTo(x, y)
            return activePath != null
        }
        val path = (activePath ?: Path().apply { moveTo(x, y) }).apply { lineTo(x, y) }
        activePath = null
        val stroke = GestureDescription.StrokeDescription(path, 0, 120)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        val success = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                Log.d("TouchService", "Touch injected at ($x, $y)")
            }
            override fun onCancelled(gestureDescription: GestureDescription?) {
                Log.w("TouchService", "Touch cancelled at ($x, $y)")
            }
        }, null)

        if (!success) Log.e("TouchService", "Failed to dispatch gesture")
        return success
    }

    fun performSystemAction(action: String): Boolean = when (action) {
        "BACK" -> performGlobalAction(GLOBAL_ACTION_BACK)
        "HOME" -> performGlobalAction(GLOBAL_ACTION_HOME)
        "RECENTS" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
        else -> false
    }
}
