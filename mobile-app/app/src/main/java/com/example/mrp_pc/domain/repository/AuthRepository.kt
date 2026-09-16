package com.example.mrp_pc.domain.repository

import com.example.mrp_pc.data.remote.dto.LoginResponse
interface AuthRepository {
    suspend fun login(username: String, password: String): LoginResponse
}
