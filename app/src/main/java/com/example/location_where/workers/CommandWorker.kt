package com.example.location_where.workers

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Toast
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.location_where.MonitoringDeviceAdminReceiver
import com.example.location_where.api.ApiService
import com.example.location_where.api.CommandExecutionRequest
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class CommandWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val apiService: ApiService
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val response = apiService.getPendingCommands()
            if (response.isSuccessful) {
                val commands = response.body()?.data ?: emptyList()
                for (command in commands) {
                    executeCommand(command)
                    apiService.markCommandExecuted(CommandExecutionRequest(command.id))
                }
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private fun executeCommand(command: com.example.location_where.data.Command) {
        val dpm = applicationContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminName = ComponentName(applicationContext, MonitoringDeviceAdminReceiver::class.java)

        when (command.commandType) {
            "LOCK" -> {
                if (dpm.isAdminActive(adminName)) {
                    dpm.lockNow()
                }
            }
            "WIPE" -> {
                if (dpm.isAdminActive(adminName)) {
                    dpm.wipeData(0)
                }
            }
            "SIREN" -> {
                val player = MediaPlayer.create(applicationContext, android.provider.Settings.System.DEFAULT_RINGTONE_URI)
                player.isLooping = true
                player.start()
                Handler(Looper.getMainLooper()).postDelayed({
                    player.stop()
                    player.release()
                }, 30000)
            }
            "MESSAGE" -> {
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(applicationContext, "ADMIN MESSAGE: ${command.commandPayload}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
