package com.example.mrp_pc.ui.login

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.local.TokenStore
import com.example.mrp_pc.data.repository.AuthRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.usecase.LoginUseCase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class LoginUiState(
    val isCheckingSession: Boolean = true,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val loggedIn: Boolean = false,
)

class LoginViewModel(application: Application) : AndroidViewModel(application) {
    private val tokenStore = TokenStore(application)

    private val loginUseCase = LoginUseCase(
        AuthRepositoryImpl(NetworkModule.apiService),
    )

    var uiState by mutableStateOf(LoginUiState())
        private set

    init {
        checkSavedSession()
    }

    private fun checkSavedSession() {
        viewModelScope.launch {
            val token = tokenStore.accessToken.first()

            uiState = LoginUiState(
                isCheckingSession = false,
                loggedIn = !token.isNullOrBlank(),
            )
        }
    }

    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            uiState = uiState.copy(
                errorMessage = "Vui lòng nhập đầy đủ thông tin",
            )
            return
        }

        viewModelScope.launch {
            uiState = uiState.copy(
                isLoading = true,
                errorMessage = null,
            )

            try {
                val result = loginUseCase(username, password)

                if (result.user.role != "staff") {
                    uiState = LoginUiState(
                        isCheckingSession = false,
                        errorMessage = "Ứng dụng chỉ dành cho nhân viên",
                    )
                    return@launch
                }

                tokenStore.saveSession(
                    token = result.accessToken,
                    username = result.user.username,
                    fullName = result.user.fullName,
                )

                uiState = LoginUiState(
                    isCheckingSession = false,
                    loggedIn = true,
                )
            } catch (error: Exception) {
                uiState = LoginUiState(
                    isCheckingSession = false,
                    errorMessage = "Sai tài khoản, mật khẩu hoặc lỗi kết nối",
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            tokenStore.clearSession()

            uiState = LoginUiState(
                isCheckingSession = false,
                loggedIn = false,
            )
        }
    }
}