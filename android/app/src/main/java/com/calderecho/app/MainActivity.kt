package com.calderecho.app

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleWidgetIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleWidgetIntent(intent)
    }

    private fun handleWidgetIntent(intent: Intent?) {
        val uri = intent?.data
        if (uri != null && uri.scheme == "com.calderecho.app") {
            val action = uri.getQueryParameter("action")
            // Pass deep link event to Capacitor bridge
            bridge?.triggerJSEvent("widgetDeepLink", "window", "{ \"action\": \"$action\" }")
        }
    }
}
