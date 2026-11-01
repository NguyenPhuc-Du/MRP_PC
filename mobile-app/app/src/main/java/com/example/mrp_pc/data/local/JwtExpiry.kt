package com.example.mrp_pc.data.local

import android.util.Base64
import org.json.JSONObject

internal fun accessTokenExpired(token: String, leewaySeconds: Long = 30): Boolean {
    val payload = token.split('.').getOrNull(1) ?: return true

    return try {
        val padded = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=')
        val decoded = Base64.decode(padded, Base64.URL_SAFE or Base64.NO_WRAP)
        val exp = JSONObject(String(decoded, Charsets.UTF_8)).optLong("exp", 0L)
        exp <= 0L || exp <= (System.currentTimeMillis() / 1000) + leewaySeconds
    } catch (_: Exception) {
        true
    }
}
