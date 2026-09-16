package com.example.mrp_pc.data.remote

import com.example.mrp_pc.data.remote.dto.LoginRequest
import com.example.mrp_pc.data.remote.dto.LoginResponse
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest,
    ): LoginResponse
}
