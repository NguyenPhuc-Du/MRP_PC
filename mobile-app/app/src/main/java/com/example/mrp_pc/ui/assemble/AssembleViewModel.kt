package com.example.mrp_pc.ui.assemble

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mrp_pc.data.repository.ProductionRepositoryImpl
import com.example.mrp_pc.di.NetworkModule
import com.example.mrp_pc.domain.model.AssembleStatus
import com.example.mrp_pc.domain.usecase.ConfirmAssembleUseCase
import com.example.mrp_pc.domain.usecase.GetAssembleStatusUseCase
import com.example.mrp_pc.domain.usecase.RequestMaterialExportUseCase
import com.example.mrp_pc.domain.usecase.RequestProductExportUseCase
import kotlinx.coroutines.launch
import retrofit2.HttpException

data class AssembleUiState(
    val isLoading: Boolean = true,
    val isWorking: Boolean = false,
    val status: AssembleStatus? = null,
    val errorMessage: String? = null,
    val successMessage: String? = null,
)

class AssembleViewModel(
    savedStateHandle: SavedStateHandle,
) : ViewModel() {
    private val orderId: Int = checkNotNull(savedStateHandle["id"])
    private val repository = ProductionRepositoryImpl(NetworkModule.apiService)

    private val getAssembleStatusUseCase = GetAssembleStatusUseCase(repository)
    private val requestMaterialExportUseCase = RequestMaterialExportUseCase(repository)
    private val confirmAssembleUseCase = ConfirmAssembleUseCase(repository)
    private val requestProductExportUseCase = RequestProductExportUseCase(repository)

    var uiState by mutableStateOf(AssembleUiState())
        private set

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            uiState = uiState.copy(isLoading = true, errorMessage = null)
            try {
                val status = getAssembleStatusUseCase(orderId)
                uiState = uiState.copy(isLoading = false, status = status)
            } catch (error: Exception) {
                uiState = uiState.copy(
                    isLoading = false,
                    errorMessage = mapError(error, "Không thể tải thông tin lắp ráp"),
                )
            }
        }
    }

    fun requestMaterial() {
        runAction("Đã gửi đề nghị xuất linh kiện") {
            requestMaterialExportUseCase(orderId)
        }
    }

    fun confirmAssemble() {
        runAction("Đã xác nhận lắp xong") {
            confirmAssembleUseCase(orderId)
        }
    }

    fun requestProduct() {
        runAction("Đã gửi đề nghị xuất thành phẩm") {
            requestProductExportUseCase(orderId)
        }
    }

    private fun runAction(successMessage: String, block: suspend () -> Unit) {
        if (uiState.isWorking) {
            return
        }

        viewModelScope.launch {
            uiState = uiState.copy(isWorking = true, errorMessage = null, successMessage = null)
            try {
                block()
                val status = getAssembleStatusUseCase(orderId)
                uiState = uiState.copy(
                    isWorking = false,
                    status = status,
                    successMessage = successMessage,
                )
            } catch (error: Exception) {
                uiState = uiState.copy(
                    isWorking = false,
                    errorMessage = mapError(error, "Không thể thực hiện thao tác"),
                )
            }
        }
    }

    private fun mapError(error: Exception, fallback: String): String {
        if (error is HttpException) {
            return when (error.code()) {
                400 -> error.response()?.errorBody()?.string()
                    ?.substringAfter("\"message\":\"")
                    ?.substringBefore("\"")
                    ?.takeIf { it.isNotBlank() }
                    ?: fallback
                401 -> "Phiên đăng nhập đã hết hạn"
                404 -> "Không tìm thấy lệnh"
                else -> fallback
            }
        }
        return fallback
    }
}
