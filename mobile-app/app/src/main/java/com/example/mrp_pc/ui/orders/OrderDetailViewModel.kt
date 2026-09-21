package com.example.mrp_pc.ui.orders

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.ProductionRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.usecase.GetOrderByIdUseCase
import kotlinx.coroutines.launch

data class OrderDetailUiState(
    val isLoading: Boolean = true,
    val order: ProductionOrder? = null,
    val errorMessage: String? = null,
)

class OrderDetailViewModel(
    savedStateHandle: SavedStateHandle,
): ViewModel() {
    private val orderId: Int = checkNotNull(savedStateHandle["id"])

    private val getOrderByIdUseCase = GetOrderByIdUseCase(
        ProductionRepositoryImpl(NetworkModule.apiService),
    )

    var uiState by mutableStateOf(OrderDetailUiState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            uiState = uiState.copy(
                isLoading = true,
                errorMessage = null
            )

            try {
                val order = getOrderByIdUseCase(orderId)
                uiState = uiState.copy(
                    isLoading = false,
                    order = order
                )
            }
            catch (error: Exception) {
                uiState = uiState.copy(
                    isLoading = false,
                    errorMessage = "Không thể tải chi tiết lệnh",
                )
            }
        }
    }
}