package com.example.mrp_pc.data.repository

import com.example.mrp_pc.data.remote.ApiService
import com.example.mrp_pc.data.remote.dto.LoginResponse
import com.example.mrp_pc.data.remote.dto.LoginRequest
import com.example.mrp_pc.domain.repository.AuthRepository

class AuthRepositoryImpl(
    private val apiService: ApiService,
) : AuthRepository {
    override suspend fun login(username: String, password: String): LoginResponse {
        return apiService.login(LoginRequest(username, password))
    }
}
