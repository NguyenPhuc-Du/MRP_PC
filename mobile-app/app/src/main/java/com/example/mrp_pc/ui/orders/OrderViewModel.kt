package com.example.mrp_pc.ui.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.ProductionRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.usecase.GetMyOrdersUseCase
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class OrderUiState(
    val isLoading: Boolean = false,
    val orders: List<ProductionOrder> = emptyList(),
    val selectedFilter: String = "ALL", // "ALL", "pending", "in_progress", "done"
    val errorMessage: String? = null,
    val newOrderCount: Int = 0,
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

    private var knownOrderIds: Set<Int> = emptySet()
    private var hasBaseline: Boolean = false
    private var pollJob: Job? = null

    init {
        loadOrders()
        startPolling()
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
                knownOrderIds = orders.map { it.id }.toSet()
                hasBaseline = true
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        orders = orders,
                        errorMessage = null,
                        newOrderCount = 0,
                    )
                }
            } catch (_: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Không thể kết nối đến máy chủ để tải danh sách lệnh",
                    )
                }
            }
        }
    }

    /** Người dùng bấm thanh "Có yêu cầu mới" → tải lại đầy đủ. */
    fun onNewOrdersBannerClick() {
        loadOrders()
    }

    private fun startPolling() {
        pollJob?.cancel()
        pollJob = viewModelScope.launch {
            while (isActive) {
                delay(POLL_INTERVAL_MS)
                pollForNewOrders()
            }
        }
    }

    private suspend fun pollForNewOrders() {
        if (!hasBaseline || _uiState.value.isLoading) return

        try {
            val orders = getMyOrdersUseCase()
            val remoteIds = orders.map { it.id }.toSet()
            val newCount = (remoteIds - knownOrderIds).size
            if (newCount != _uiState.value.newOrderCount) {
                _uiState.update { it.copy(newOrderCount = newCount) }
            }
        } catch (_: Exception) {
            // Bỏ qua lỗi poll nền; lần sau thử lại.
        }
    }

    override fun onCleared() {
        pollJob?.cancel()
        super.onCleared()
    }

    companion object {
        private const val POLL_INTERVAL_MS = 8_000L
    }
}
