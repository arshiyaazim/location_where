package com.example.location_where

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.location_where.api.ApiService
import com.example.location_where.databinding.ActivityConsentBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class ConsentActivity : AppCompatActivity() {

    private lateinit var binding: ActivityConsentBinding

    @Inject
    lateinit var apiService: ApiService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityConsentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.agreeCheckbox.setOnCheckedChangeListener { _, isChecked ->
            binding.continueBtn.isEnabled = isChecked
        }

        binding.continueBtn.setOnClickListener {
            saveConsent()
        }
    }

    private fun saveConsent() {
        val sharedPrefs = getSharedPreferences("MonitoringPrefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().putBoolean("consent_signed", true).apply()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Assuming employee ID is available in TokenManager or similar
                // apiService.submitConsent(...) 
            } catch (e: Exception) { }
        }

        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
