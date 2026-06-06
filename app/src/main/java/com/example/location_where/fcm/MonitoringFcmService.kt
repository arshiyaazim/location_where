package com.example.location_where.fcm

import android.util.Log
import com.example.location_where.api.ApiService
import com.example.location_where.api.CommandExecutionRequest
import com.example.location_where.utils.TokenManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MonitoringFcmService : FirebaseMessagingService() {

    @Inject
    lateinit var apiService: ApiService

    @Inject
    lateinit var tokenManager: TokenManager

    private val serviceScope = CoroutineScope(Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "New token: $token")
        // TODO: Send token to backend
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        val type = message.data["type"]
        if (type == "REMOTE_COMMAND") {
            val command = message.data["command"]
            val commandId = message.data["commandId"]
            Log.d("FCM", "Received command: $command")
            
            // Execute command logic here (LOCK, WIPE, etc.)
            
            if (commandId != null) {
                markExecuted(commandId)
            }
        }
    }

    private fun markExecuted(id: String) {
        serviceScope.launch {
            try {
                apiService.markCommandExecuted(CommandExecutionRequest(id))
            } catch (e: Exception) {
                Log.e("FCM", "Failed to mark command executed", e)
            }
        }
    }
}
