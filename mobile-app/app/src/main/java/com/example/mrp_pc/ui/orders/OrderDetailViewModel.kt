package com.example.mrp_pc.ui.orders

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.ProductionRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.usecase.GetOrderByIdUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrderDetailUiState(
    val isLoading: Boolean = true,
    val order: ProductionOrder? = null,
    val errorMessage: String? = null,
)

class OrderDetailViewModel(
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val orderId: Int = checkNotNull(savedStateHandle["id"])

    private val getOrderByIdUseCase = GetOrderByIdUseCase(
        ProductionRepositoryImpl(NetworkModule.apiService),
    )

    private val _uiState = MutableStateFlow(OrderDetailUiState())
    val uiState: StateFlow<OrderDetailUiState> = _uiState.asStateFlow()

    val state: OrderDetailUiState get() = _uiState.value

    init {
        load()
    }

    fun load() {
        if (_uiState.value.isLoading && _uiState.value.order != null) return

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    errorMessage = null,
                )
            }

            try {
                val order = getOrderByIdUseCase(orderId)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        order = order,
                        errorMessage = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Không thể tải thông tin chi tiết lệnh sản xuất #${orderId}",
                    )
                }
            }
        }
    }
}