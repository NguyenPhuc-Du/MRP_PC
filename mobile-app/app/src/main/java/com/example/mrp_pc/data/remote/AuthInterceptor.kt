package com.example.mrp_pc.data.remote

import com.example.mrp_pc.data.local.TokenStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenStore: TokenStore,
): Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking {
            tokenStore.getAccessToken()
        }

        val requestBuilder = chain.request()
            .newBuilder()

        if (!token.isNullOrBlank()) {
            requestBuilder.addHeader(
                "Authorization",
                "Bearer $token",
            )
        }

        return chain.proceed(requestBuilder.build())
    }
}