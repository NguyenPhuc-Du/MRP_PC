package com.example.mrp_pc.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.mrp_pc.ui.login.LoginScreen
import com.example.mrp_pc.ui.login.LoginViewModel
import com.example.mrp_pc.ui.orders.OrderListScreen
import com.example.mrp_pc.ui.orders.OrderViewModel
import com.example.mrp_pc.ui.orders.SessionLoadingScreen

@Composable
fun MrpNavGraph() {
    val loginViewModel: LoginViewModel = viewModel()
    val state = loginViewModel.uiState

    when {
        state.isCheckingSession -> {
            SessionLoadingScreen()
        }

        state.loggedIn -> {
            val orderViewModel: OrderViewModel = viewModel()
            val orderState = orderViewModel.uiState

            OrderListScreen(
                orders = orderState.orders,
                isLoading = orderState.isLoading,
                errorMessage = orderState.errorMessage,
                onRetry = orderViewModel::loadOrders,
                onLogout = loginViewModel::logout,
            )
        }

        else -> {
            LoginScreen(
                onSignIn = loginViewModel::login,
                isLoading = state.isLoading,
                errorMessage = state.errorMessage,
            )
        }
    }
}