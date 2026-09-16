package com.example.mrp_pc.domain.usecase

import com.example.mrp_pc.domain.repository.AuthRepository

class LoginUseCase(
    private val repository: AuthRepository,
) {
    suspend operator fun invoke(username: String, password: String) =
        repository.login(username, password)
}
