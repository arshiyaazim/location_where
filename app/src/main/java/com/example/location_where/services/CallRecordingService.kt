package com.example.location_where.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyManager
import android.util.Log
import com.example.location_where.api.ApiService
import com.example.location_where.api.CallLogRequest
import com.example.location_where.utils.EncryptionUtils
import com.example.location_where.utils.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@AndroidEntryPoint
class CallRecordingService : Service() {

    @Inject
    lateinit var apiService: ApiService

    @Inject
    lateinit var tokenManager: TokenManager

    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    private var audioFile: File? = null
    private var currentPhoneNumber: String? = null
    private var callStartTime: Long = 0
    private var callType: String = "UNKNOWN"

    private val serviceScope = CoroutineScope(Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        telephonyManager.listen(callStateListener, PhoneStateListener.LISTEN_CALL_STATE)
    }

    private val callStateListener = object : PhoneStateListener() {
        override fun onCallStateChanged(state: Int, phoneNumber: String?) {
            when (state) {
                TelephonyManager.CALL_STATE_OFFHOOK -> {
                    // Call started (Outgoing or Answered)
                    currentPhoneNumber = phoneNumber
                    callStartTime = System.currentTimeMillis()
                    startRecording()
                }
                TelephonyManager.CALL_STATE_IDLE -> {
                    // Call ended
                    if (isRecording) {
                        stopRecording()
                        saveAndUploadCall(phoneNumber)
                    }
                }
                TelephonyManager.CALL_STATE_RINGING -> {
                    // Incoming call
                    currentPhoneNumber = phoneNumber
                    callType = "INCOMING"
                }
            }
        }
    }

    private fun startRecording() {
        try {
            audioFile = File(externalCacheDir, "call_${System.currentTimeMillis()}.mp4")
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                MediaRecorder()
            }

            mediaRecorder?.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setOutputFile(audioFile?.absolutePath)
                prepare()
                start()
            }
            isRecording = true
            Log.d("CallRecord", "Recording started")
        } catch (e: Exception) {
            Log.e("CallRecord", "Failed to start recording", e)
        }
    }

    private fun stopRecording() {
        try {
            mediaRecorder?.stop()
            mediaRecorder?.release()
            mediaRecorder = null
            isRecording = false
            Log.d("CallRecord", "Recording stopped")
        } catch (e: Exception) {
            Log.e("CallRecord", "Failed to stop recording", e)
        }
    }

    private fun saveAndUploadCall(phoneNumber: String?) {
        val number = phoneNumber ?: currentPhoneNumber ?: "Unknown"
        val duration = ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        val startedAt = sdf.format(Date(callStartTime))
        val endedAt = sdf.format(Date())

        val request = CallLogRequest(
            callType = if (callType == "INCOMING") "INCOMING" else "OUTGOING",
            phoneNumber = number,
            duration = duration,
            startedAt = startedAt,
            endedAt = endedAt
        )

        serviceScope.launch {
            try {
                val logResponse = apiService.uploadCallLog(request)
                if (logResponse.isSuccessful) {
                    val callLogId = logResponse.body()?.data?.id
                    if (callLogId != null && audioFile != null) {
                        uploadRecording(callLogId, audioFile!!)
                    }
                }
            } catch (e: Exception) {
                Log.e("CallRecord", "Failed to upload call log", e)
            }
        }
    }

    private suspend fun uploadRecording(callLogId: String, file: File) {
        val encryptedFile = File(file.parent, file.name + ".enc")
        EncryptionUtils.encryptFile(file, encryptedFile)
        val checksum = EncryptionUtils.calculateChecksum(encryptedFile)

        val requestFile = encryptedFile.asRequestBody("audio/mp4".toMediaTypeOrNull())
        val body = MultipartBody.Part.createFormData("recording", encryptedFile.name, requestFile)
        val idBody = callLogId.toRequestBody("text/plain".toMediaTypeOrNull())
        val checksumBody = checksum.toRequestBody("text/plain".toMediaTypeOrNull())

        try {
            val response = apiService.uploadCallRecording(body, idBody, checksumBody)
            if (response.isSuccessful) {
                Log.d("CallRecord", "Recording uploaded successfully")
                file.delete()
                encryptedFile.delete()
            }
        } catch (e: Exception) {
            Log.e("CallRecord", "Failed to upload recording", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        telephonyManager.listen(callStateListener, PhoneStateListener.LISTEN_NONE)
    }
}
