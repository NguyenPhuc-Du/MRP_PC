package com.example.mrp_pc.di

import android.content.Context
import com.example.mrp_pc.data.local.TokenStore
import com.example.mrp_pc.data.remote.ApiService
import com.example.mrp_pc.data.remote.AuthInterceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object NetworkModule {
    private const val BASE_URL = "http://10.0.2.2:3000/"

    lateinit var apiService: ApiService
        private set

    fun initialize(context: Context) {
        val tokenStore = TokenStore(context)

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .build()

        apiService = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
