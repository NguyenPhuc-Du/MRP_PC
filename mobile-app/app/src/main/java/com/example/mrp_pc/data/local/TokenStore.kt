package com.example.mrp_pc.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first

private val Context.authDataStore by preferencesDataStore(name = "auth")

class TokenStore(context: Context) {
    private val dataStore = context.applicationContext.authDataStore

    private object Keys {
        val accessToken = stringPreferencesKey("access_token")
        val username = stringPreferencesKey("username")
        val fullName = stringPreferencesKey("full_name")
    }

    val accessToken: Flow<String?> = dataStore.data.map { preferences -> preferences[Keys.accessToken] }

    suspend fun saveSession(
        token: String,
        username: String,
        fullName: String?,
    ){
        dataStore.edit {
            preferences ->

            preferences[Keys.accessToken] = token
            preferences[Keys.username] = username

            if (fullName != null) {
                preferences[Keys.fullName] = fullName
            } else {
                preferences.remove(Keys.fullName)
            }
        }
    }

    suspend fun getAccessToken(): String?{
        return accessToken.first()
    }

    suspend fun clearSession () {
        dataStore.edit {
            preferences -> preferences.clear()
        }
    }
}
