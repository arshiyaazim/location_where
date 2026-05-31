package com.example.location_where

import android.content.Context
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.location_where.api.DeviceInfoMap
import com.example.location_where.api.RetrofitClient
import com.example.location_where.api.SimAlert

class SimCheckWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val subscriptionManager = applicationContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
        
        try {
            val activeSubscriptions = subscriptionManager.activeSubscriptionInfoList
            if (activeSubscriptions != null) {
                for (info in activeSubscriptions) {
                    val currentIccId = info.iccId
                    val currentImsi = "" // IMSI is harder to get on newer Android, using ICCID for logic
                    
                    // Logic: Compare currentIccId with authorized ICCID from SharedPreferences
                    val sharedPrefs = applicationContext.getSharedPreferences("MonitoringPrefs", Context.MODE_PRIVATE)
                    val savedIccId = sharedPrefs.getString("authorized_iccid", null)

                    if (savedIccId != null && savedIccId != currentIccId) {
                        sendSimAlert(savedIccId, currentIccId, null, info.subscriptionId.toString())
                    } else if (savedIccId == null) {
                        // First run: Save current as authorized
                        sharedPrefs.edit().putString("authorized_iccid", currentIccId).apply()
                    }
                }
            }
        } catch (e: SecurityException) {
            Log.e("SimCheckWorker", "Permission denied", e)
        }

        return Result.success()
    }

    private suspend fun sendSimAlert(oldSim: String, newSim: String, oldImsi: String?, newImsi: String) {
        val alert = SimAlert(
            previousSim = oldSim,
            newSim = newSim,
            previousIMSI = oldImsi,
            newIMSI = newImsi,
            deviceInfo = DeviceInfoMap(
                deviceModel = Build.MODEL,
                androidVersion = Build.VERSION.RELEASE
            )
        )

        try {
            val token = "Bearer YOUR_MOCK_TOKEN"
            val response = RetrofitClient.instance.sendSimAlert(token, alert)
            if (response.isSuccessful) {
                Log.d("SimCheckWorker", "SIM alert sent")
            }
        } catch (e: Exception) {
            Log.e("SimCheckWorker", "Failed to send alert", e)
        }
    }
}
