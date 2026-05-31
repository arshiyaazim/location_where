package com.example.location_where.data.repository

import android.content.Context
import android.location.Geocoder
import com.example.location_where.api.ApiService
import com.example.location_where.data.LocationUpdate
import com.example.location_where.data.local.LocationDao
import com.example.location_where.data.local.LocationEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepository @Inject constructor(
    private val apiService: ApiService,
    private val locationDao: LocationDao,
    @ApplicationContext private val context: Context
) {

    suspend fun saveLocation(
        latitude: Double,
        longitude: Double,
        accuracy: Float,
        batteryLevel: Int
    ) {
        val address = getAddress(latitude, longitude)
        val entity = LocationEntity(
            latitude = latitude,
            longitude = longitude,
            accuracy = accuracy,
            batteryLevel = batteryLevel,
            address = address,
            timestamp = System.currentTimeMillis()
        )
        
        locationDao.insertLocation(entity)
        uploadPendingLocations()
    }

    suspend fun uploadPendingLocations() {
        val unsynced = locationDao.getUnsyncedLocations()
        if (unsynced.isEmpty()) return

        for (loc in unsynced) {
            try {
                val update = LocationUpdate(
                    latitude = loc.latitude,
                    longitude = loc.longitude,
                    accuracy = loc.accuracy,
                    batteryLevel = loc.batteryLevel
                    // Add address field to LocationUpdate if needed by API
                )
                
                val response = apiService.updateLocation(update)
                if (response.isSuccessful) {
                    locationDao.markAsSynced(listOf(loc.id))
                }
            } catch (e: Exception) {
                // Network error, will retry later
                break 
            }
        }
    }

    private fun getAddress(lat: Double, lng: Double): String? {
        return try {
            val geocoder = Geocoder(context, Locale.getDefault())
            val addresses = geocoder.getFromLocation(lat, lng, 1)
            if (addresses?.isNotEmpty() == true) {
                addresses[0].getAddressLine(0)
            } else null
        } catch (e: Exception) {
            null
        }
    }
}
