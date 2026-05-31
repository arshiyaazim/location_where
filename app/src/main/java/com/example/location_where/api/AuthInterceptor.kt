package com.example.location_where.api

import com.example.location_where.data.RefreshRequest
import com.example.location_where.utils.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager,
    private val apiService: Lazy<ApiService>
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val accessToken = runBlocking { tokenManager.getAccessToken() }
        val originalRequest = chain.request()
        
        val requestWithToken = originalRequest.newBuilder()
            .header("Authorization", "Bearer $accessToken")
            .build()

        val response = chain.proceed(requestWithToken)

        if (response.code == 401) {
            response.close()
            val refreshToken = runBlocking { tokenManager.getRefreshToken() }
            if (refreshToken != null) {
                val newAccessToken = runBlocking {
                    val refreshResponse = apiService.value.refreshToken(RefreshRequest(refreshToken))
                    if (refreshResponse.isSuccessful) {
                        refreshResponse.body()?.data?.accessToken?.also {
                            tokenManager.saveTokens(it, refreshToken)
                        }
                    } else {
                        null
                    }
                }

                if (newAccessToken != null) {
                    val retryRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer $newAccessToken")
                        .build()
                    return chain.proceed(retryRequest)
                }
            }
            // If refresh fails or no refresh token, tokenManager.clearTokens() could be called here
            // and app should redirect to login.
        }

        return response
    }
}
