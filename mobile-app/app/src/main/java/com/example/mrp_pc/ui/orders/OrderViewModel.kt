package com.example.mrp_pc.ui.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.ProductionRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.usecase.GetMyOrdersUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrderUiState(
    val isLoading: Boolean = false,
    val orders: List<ProductionOrder> = emptyList(),
    val selectedFilter: String = "ALL", // "ALL", "pending", "in_progress", "done"
    val errorMessage: String? = null,
) {
    val filteredOrders: List<ProductionOrder>
        get() = if (selectedFilter == "ALL") {
            orders
        } else {
            orders.filter { it.status.equals(selectedFilter, ignoreCase = true) }
        }
}

class OrderViewModel : ViewModel() {
    private val getMyOrdersUseCase = GetMyOrdersUseCase(
        ProductionRepositoryImpl(NetworkModule.apiService),
    )

    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState: StateFlow<OrderUiState> = _uiState.asStateFlow()

    val state: OrderUiState get() = _uiState.value

    init {
        loadOrders()
    }

    fun setFilter(filter: String) {
        _uiState.update { it.copy(selectedFilter = filter) }
    }

    fun loadOrders() {
        if (_uiState.value.isLoading) return

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    errorMessage = null,
                )
            }

            try {
                val orders = getMyOrdersUseCase()
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        orders = orders,
                        errorMessage = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Không thể kết nối đến máy chủ để tải danh sách lệnh",
                    )
                }
            }
        }
    }
}
