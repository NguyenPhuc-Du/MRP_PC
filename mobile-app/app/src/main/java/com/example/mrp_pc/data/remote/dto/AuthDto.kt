package com.example.mrp_pc.data.remote.dto

data class LoginRequest(
    val username: String,
    val password: String,
)

data class UserDto(
    val id: Int,
    val username: String,
    val fullName: String?,
    val role: String,
)

data class LoginResponse(
    val accessToken: String,
    val user: UserDto,
)
