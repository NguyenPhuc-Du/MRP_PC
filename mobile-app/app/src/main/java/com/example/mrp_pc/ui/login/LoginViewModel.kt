package com.example.mrp_pc.ui.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.AuthRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.repository.AuthRepository
import com.example.mrp_pc.domain.usecase.LoginUseCase
import kotlinx.coroutines.launch

data class LoginUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val loggedIn: Boolean = false,
)

class LoginViewModel : ViewModel() {
    private val loginUseCase = LoginUseCase(
        AuthRepositoryImpl(NetworkModule.apiService),
    )

    var uiState by mutableStateOf(LoginUiState())
        private set

    fun login(username: String, password: String) {
        viewModelScope.launch {
            uiState = LoginUiState(isLoading = true)

            try {
                val result = loginUseCase(username, password)

                if (result.user.role != "staff") {
                    uiState = LoginUiState(
                        errorMessage = "Ứng dụng dành cho nhân viên"
                    )

                    return@launch
                }

                uiState = LoginUiState(loggedIn = true)
            }
            catch (error: Exception) {
                uiState = LoginUiState(
                    errorMessage = "Sai tài khoản hoặc mật khẩu"
                )
            }
        }
    }
}
