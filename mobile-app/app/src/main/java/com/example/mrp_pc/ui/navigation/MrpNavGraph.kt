package com.example.mrp_pc.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.mrp_pc.ui.assemble.AssembleScreen
import com.example.mrp_pc.ui.assemble.AssembleViewModel
import com.example.mrp_pc.ui.login.LoginScreen
import com.example.mrp_pc.ui.login.LoginViewModel
import com.example.mrp_pc.ui.orders.OrderDetailScreen
import com.example.mrp_pc.ui.orders.OrderDetailViewModel
import com.example.mrp_pc.ui.orders.OrderListScreen
import com.example.mrp_pc.ui.orders.OrderViewModel
import com.example.mrp_pc.ui.orders.SessionLoadingScreen
import com.example.mrp_pc.ui.stock.StockScreen
import com.example.mrp_pc.ui.stock.StockViewModel

@Composable
fun MrpNavGraph() {
    val loginViewModel: LoginViewModel = viewModel()
    val state = loginViewModel.uiState

    when {
        state.isCheckingSession -> {
            SessionLoadingScreen()
        }

        state.loggedIn -> {
            val navController = rememberNavController()

            NavHost(
                navController = navController,
                startDestination = Routes.ORDERS,
            ) {
                composable(Routes.ORDERS) {
                    val orderViewModel: OrderViewModel = viewModel()
                    val orderState = orderViewModel.uiState

                    OrderListScreen(
                        orders = orderState.orders,
                        isLoading = orderState.isLoading,
                        errorMessage = orderState.errorMessage,
                        onRetry = orderViewModel::loadOrders,
                        onLogout = loginViewModel::logout,
                        onOrderClick = { id ->
                            navController.navigate(Routes.orderDetail(id))
                        },
                    )
                }

                composable(
                    route = Routes.ORDER_DETAIL,
                    arguments = listOf(navArgument("id") { type = NavType.IntType }),
                ) { entry ->
                    val orderId = entry.arguments?.getInt("id") ?: return@composable
                    val detailViewModel: OrderDetailViewModel = viewModel()
                    val detailState = detailViewModel.uiState

                    OrderDetailScreen(
                        state = detailState,
                        onBack = { navController.popBackStack() },
                        onRetry = detailViewModel::load,
                        onCheckStock = { navController.navigate(Routes.stock(orderId)) },
                        onAssemble = { navController.navigate(Routes.assemble(orderId)) },
                    )
                }

                composable(
                    route = Routes.STOCK,
                    arguments = listOf(navArgument("id") { type = NavType.IntType }),
                ) { entry ->
                    val orderId = entry.arguments?.getInt("id") ?: return@composable
                    val stockViewModel: StockViewModel = viewModel()
                    val stockState = stockViewModel.uiState

                    StockScreen(
                        state = stockState,
                        onBack = { navController.popBackStack() },
                        onRetry = stockViewModel::load,
                        onContinueAssemble = { navController.navigate(Routes.assemble(orderId)) },
                    )
                }

                composable(
                    route = Routes.ASSEMBLE,
                    arguments = listOf(navArgument("id") { type = NavType.IntType }),
                ) {
                    val assembleViewModel: AssembleViewModel = viewModel()
                    val assembleState = assembleViewModel.uiState

                    AssembleScreen(
                        state = assembleState,
                        onBack = { navController.popBackStack() },
                        onRetry = assembleViewModel::load,
                        onRequestMaterial = assembleViewModel::requestMaterial,
                        onConfirmAssemble = assembleViewModel::confirmAssemble,
                        onRequestProduct = assembleViewModel::requestProduct,
                    )
                }
            }
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
