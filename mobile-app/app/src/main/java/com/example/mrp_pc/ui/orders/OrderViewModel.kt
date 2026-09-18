package com.example.mrp_pc.ui.orders

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.ProductionRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.usecase.GetMyOrdersUseCase
import kotlinx.coroutines.launch

data class OrderUiState(
    val isLoading: Boolean = false,
    val orders: List<ProductionOrder> = emptyList(),
    val errorMessage: String? = null,
)

class OrderViewModel: ViewModel() {
    private val getMyOrdersUseCase = GetMyOrdersUseCase(
        ProductionRepositoryImpl(NetworkModule.apiService),
    )

    var uiState by mutableStateOf(OrderUiState())
        private set

    init {
        loadOrders()
    }

    fun loadOrders() {
        viewModelScope.launch {
            uiState = uiState.copy(
                isLoading = true,
                errorMessage = null,
            )

            try{
                val orders = getMyOrdersUseCase()

                uiState = uiState.copy(
                    isLoading = false,
                    orders = orders,
                )
            }catch (error: Exception) {
                uiState = uiState.copy(
                    isLoading = false,
                    errorMessage = "Không thể tải danh sách"
                )
            }
        }
    }
}
