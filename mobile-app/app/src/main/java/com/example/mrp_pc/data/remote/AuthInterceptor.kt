package com.example.mrp_pc.data.remote

import com.example.mrp_pc.data.local.TokenStore
import com.example.mrp_pc.data.local.accessTokenExpired
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody

class AuthInterceptor(
    private val tokenStore: TokenStore,
): Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking {
            tokenStore.getAccessToken()
        }

        val original = chain.request()
        val isLogin = original.url.encodedPath.endsWith("/auth/login")

        if (!isLogin && !token.isNullOrBlank() && accessTokenExpired(token)) {
            runBlocking { tokenStore.clearSession() }
            SessionBus.notifyExpired()
            return expiredResponse(original)
        }

        val requestBuilder = original.newBuilder()
            .header("ngrok-skip-browser-warning", "true")

        if (!token.isNullOrBlank()) {
            requestBuilder.header(
                "Authorization",
                "Bearer $token",
            )
        }

        val response = chain.proceed(requestBuilder.build())

        if (response.code == 401 && !isLogin) {
            runBlocking { tokenStore.clearSession() }
            SessionBus.notifyExpired()
        }

        return response
    }

    private fun expiredResponse(request: okhttp3.Request): Response {
        return Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(401)
            .message("Unauthorized")
            .body(
                "{\"message\":\"Access token has expired\"}"
                    .toResponseBody("application/json".toMediaType()),
            )
            .build()
    }
}