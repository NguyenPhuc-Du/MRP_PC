package com.example.mrp_pc.ui.stock

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.InventoryRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.StockCheckResult
import com.example.mrp_pc.domain.usecase.CheckStockUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
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

    private val _uiState = MutableStateFlow(StockUiState())
    val uiState: StateFlow<StockUiState> = _uiState.asStateFlow()

    val state: StockUiState get() = _uiState.value

    init {
        load()
    }

    fun load() {
        if (_uiState.value.isLoading && _uiState.value.result != null) return

        viewModelScope.launch {
            _uiState.update {
                it.copy(isLoading = true, errorMessage = null)
            }

            try {
                val result = checkStockUseCase(orderId)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        result = result,
                        errorMessage = null,
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Không thể kiểm tra tồn kho linh kiện cho lệnh #${orderId}",
                    )
                }
            }
        }
    }
}