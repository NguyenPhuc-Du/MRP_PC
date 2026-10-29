package com.example.mrp_pc.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.local.TokenStore
import com.example.mrp_pc.data.repository.AuthRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.usecase.LoginUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
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

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    // Convenience property for immediate value access
    val state: LoginUiState get() = _uiState.value

    init {
        checkSavedSession()
    }

    private fun checkSavedSession() {
        viewModelScope.launch {
            val token = tokenStore.accessToken.first()

            _uiState.update {
                it.copy(
                    isCheckingSession = false,
                    loggedIn = !token.isNullOrBlank(),
                )
            }
        }
    }

    fun login(username: String, password: String) {
        // Prevent concurrent double-clicks
        if (_uiState.value.isLoading) return

        if (username.isBlank() || password.isBlank()) {
            _uiState.update {
                it.copy(errorMessage = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu")
            }
            return
        }

        viewModelScope.launch {
            _uiState.update {
                it.copy(isLoading = true, errorMessage = null)
            }

            try {
                val result = loginUseCase(username.trim(), password)

                if (result.user.role != "staff") {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Ứng dụng chỉ dành cho tài khoản nhân viên lắp ráp",
                        )
                    }
                    return@launch
                }

                tokenStore.saveSession(
                    token = result.accessToken,
                    username = result.user.username,
                    fullName = result.user.fullName,
                )

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        loggedIn = true,
                        errorMessage = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Sai tài khoản, mật khẩu hoặc lỗi kết nối máy chủ",
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            tokenStore.clearSession()
            _uiState.update {
                it.copy(
                    isCheckingSession = false,
                    loggedIn = false,
                    errorMessage = null,
                )
            }
        }
    }
}