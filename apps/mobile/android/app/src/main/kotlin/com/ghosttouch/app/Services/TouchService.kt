package com.ghosttouch.app.Services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class TouchService : AccessibilityService() {

    companion object {
        var instance: TouchService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i("TouchService", "GhostTouch Accessibility Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not specifically tracking events, just here to inject
    }

    override fun onInterrupt() {
        Log.w("TouchService", "GhostTouch Accessibility Service Interrupted")
    }

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }

    fun injectTouch(action: String, x: Float, y: Float) {
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 50) // 50ms tap
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        val success = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("TouchService", "Touch injected successfully at $x, $y")
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w("TouchService", "Touch injection cancelled at $x, $y")
            }
        }, null)

        if (!success) {
            Log.e("TouchService", "Failed to dispatch gesture")
        }
    }
}
