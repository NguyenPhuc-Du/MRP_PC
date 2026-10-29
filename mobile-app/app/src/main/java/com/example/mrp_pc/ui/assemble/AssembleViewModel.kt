package com.example.mrp_pc.ui.assemble

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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
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

    private val _uiState = MutableStateFlow(AssembleUiState())
    val uiState: StateFlow<AssembleUiState> = _uiState.asStateFlow()

    val state: AssembleUiState get() = _uiState.value

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val status = getAssembleStatusUseCase(orderId)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        status = status,
                        errorMessage = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = mapError(error, "Không thể tải thông tin lắp ráp lệnh #${orderId}"),
                    )
                }
            }
        }
    }

    fun requestMaterial() {
        runAction("Đã gửi đề nghị xuất kho linh kiện thành công") {
            requestMaterialExportUseCase(orderId)
        }
    }

    fun confirmAssemble() {
        runAction("Đã xác nhận hoàn thành lắp ráp PC") {
            confirmAssembleUseCase(orderId)
        }
    }

    fun requestProduct() {
        runAction("Đã gửi đề nghị xuất thành phẩm hoàn tất") {
            requestProductExportUseCase(orderId)
        }
    }

    private fun runAction(successMessage: String, block: suspend () -> Unit) {
        // Prevent concurrent double-execution
        if (_uiState.value.isWorking) {
            return
        }

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isWorking = true,
                    errorMessage = null,
                    successMessage = null,
                )
            }

            try {
                block()
                val status = getAssembleStatusUseCase(orderId)
                _uiState.update {
                    it.copy(
                        isWorking = false,
                        status = status,
                        successMessage = successMessage,
                        errorMessage = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isWorking = false,
                        errorMessage = mapError(error, "Không thể thực hiện thao tác. Vui lòng thử lại."),
                    )
                }
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
                401 -> "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                404 -> "Không tìm thấy lệnh sản xuất."
                else -> fallback
            }
        }
        return fallback
    }
}
