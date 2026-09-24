package com.example.mrp_pc.ui.stock

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.InventoryRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.StockCheckResult
import com.example.mrp_pc.domain.usecase.CheckStockUseCase
import kotlinx.coroutines.launch

data class StockUiState(
    val isLoading: Boolean = true,
    val result: StockCheckResult? = null,
    val errorMessage: String? = null,
)

class StockViewModel(
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val orderId: Int = checkNotNull(savedStateHandle["id"])

    private val checkStockUseCase = CheckStockUseCase(
        InventoryRepositoryImpl(NetworkModule.apiService),
    )

    var uiState by mutableStateOf(StockUiState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            try {
                val result = checkStockUseCase(orderId)
                uiState = uiState.copy(isLoading = false, result = result)
            } catch (e: Exception) {
                uiState = uiState.copy(
                    isLoading = false,
                    errorMessage = "Không thể kiểm tra tồn kho",
                )
            }
        }
    }
}