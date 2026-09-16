package com.example.mrp_pc.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.mrp_pc.ui.login.LoginScreen
import com.example.mrp_pc.ui.login.LoginViewModel

@Composable
fun MrpNavGraph() {
    val loginViewModel: LoginViewModel = viewModel()
    val state = loginViewModel.uiState

    LoginScreen(
        onSignIn = loginViewModel::login,
        isLoading = state.isLoading,
        errorMessage = state.errorMessage,
    )
}
