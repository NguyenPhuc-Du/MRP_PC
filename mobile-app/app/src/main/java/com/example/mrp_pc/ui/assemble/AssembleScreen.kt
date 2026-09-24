package com.example.mrp_pc.ui.assemble

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.AssembleStatus
import com.example.mrp_pc.domain.model.ExportTicket
import com.example.mrp_pc.ui.components.AppHeader
import com.example.mrp_pc.ui.components.AppScreen
import com.example.mrp_pc.ui.components.EmptyState
import com.example.mrp_pc.ui.components.LoadingState
import com.example.mrp_pc.ui.components.PrimaryButton
import com.example.mrp_pc.ui.components.SecondaryButton
import com.example.mrp_pc.ui.components.SectionCard
import com.example.mrp_pc.ui.components.StatusChip
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.BrandBlueSoft
import com.example.mrp_pc.ui.theme.Danger
import com.example.mrp_pc.ui.theme.DangerSoft
import com.example.mrp_pc.ui.theme.Ink
import com.example.mrp_pc.ui.theme.MutedText
import com.example.mrp_pc.ui.theme.Success
import com.example.mrp_pc.ui.theme.SuccessSoft
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.Warning
import com.example.mrp_pc.ui.theme.WarningSoft
import androidx.compose.ui.tooling.preview.Preview

@Composable
fun AssembleScreen(
    state: AssembleUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onRequestMaterial: () -> Unit,
    onConfirmAssemble: () -> Unit,
    onRequestProduct: () -> Unit,
) {
    AppScreen {
        AppHeader(
            title = "Lắp ráp",
            subtitle = "Xuất NVL · Lắp xong · Xuất thành phẩm",
            onBack = onBack,
        )

        when {
            state.isLoading -> LoadingState("Đang tải tiến độ lắp ráp...")
            state.errorMessage != null && state.status == null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không tải được lắp ráp",
                message = state.errorMessage,
                actionLabel = "Thử lại",
                onAction = onRetry,
            )
            state.status != null -> AssembleContent(
                status = state.status,
                isWorking = state.isWorking,
                errorMessage = state.errorMessage,
                successMessage = state.successMessage,
                onRequestMaterial = onRequestMaterial,
                onConfirmAssemble = onConfirmAssemble,
                onRequestProduct = onRequestProduct,
            )
        }
    }
}

@Composable
private fun AssembleContent(
    status: AssembleStatus,
    isWorking: Boolean,
    errorMessage: String?,
    successMessage: String?,
    onRequestMaterial: () -> Unit,
    onConfirmAssemble: () -> Unit,
    onRequestProduct: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionCard {
            Text(status.configName, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Ink)
            if (!status.description.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(status.description, color = MutedText, fontSize = 14.sp)
            }
            Spacer(Modifier.height(12.dp))
            Text("Lệnh #${status.orderId} · ${status.quantity} máy", color = MutedText)
            Spacer(Modifier.height(10.dp))
            StatusChip(status.status)
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(if (status.allEnough) SuccessSoft else WarningSoft)
                .padding(12.dp),
        ) {
            Text(
                if (status.allEnough) "Kho đủ linh kiện để lắp"
                else "Thiếu ${status.missingCount} loại linh kiện",
                color = if (status.allEnough) Success else Warning,
                fontWeight = FontWeight.Medium,
                fontSize = 13.sp,
            )
        }

        if (successMessage != null) {
            Banner(successMessage, SuccessSoft, Success)
        }
        if (errorMessage != null) {
            Banner(errorMessage, DangerSoft, Danger)
        }

        StepCard(
            number = "1",
            icon = Icons.Filled.Inventory2,
            title = "Đề nghị xuất linh kiện",
            ticket = status.materialExport,
            enabled = status.canRequestMaterial && !isWorking,
            buttonLabel = "Gửi đề nghị xuất NVL",
            filled = true,
            onClick = onRequestMaterial,
        )
        StepCard(
            number = "2",
            icon = Icons.Filled.Build,
            title = "Xác nhận lắp xong",
            ticket = null,
            subtitle = if (status.status == "done") "Đã hoàn thành lắp ráp" else "Trừ tồn kho và đóng lệnh",
            enabled = status.canConfirmAssemble && !isWorking,
            buttonLabel = "Xác nhận lắp xong",
            filled = true,
            onClick = onConfirmAssemble,
        )
        StepCard(
            number = "3",
            icon = Icons.Filled.LocalShipping,
            title = "Đề nghị xuất thành phẩm",
            ticket = status.productExport,
            enabled = status.canRequestProduct && !isWorking,
            buttonLabel = "Gửi đề nghị xuất thành phẩm",
            filled = false,
            onClick = onRequestProduct,
        )

        if (isWorking) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                CircularProgressIndicator(Modifier.size(22.dp), color = BrandBlue, strokeWidth = 2.dp)
            }
        }
    }
}

@Composable
private fun StepCard(
    number: String,
    icon: ImageVector,
    title: String,
    ticket: ExportTicket?,
    subtitle: String? = null,
    enabled: Boolean,
    buttonLabel: String,
    filled: Boolean,
    onClick: () -> Unit,
) {
    SectionCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(BrandBlueSoft),
                contentAlignment = Alignment.Center,
            ) {
                Text(number, color = BrandBlue, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.width(10.dp))
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = Ink)
        }
        Spacer(Modifier.height(10.dp))
        when {
            ticket != null -> Text("${ticket.code} · ${exportStatusLabel(ticket.status)}", color = MutedText, fontSize = 13.sp)
            subtitle != null -> Text(subtitle, color = MutedText, fontSize = 13.sp)
            else -> Text("Chưa tạo phiếu", color = MutedText, fontSize = 13.sp)
        }
        Spacer(Modifier.height(12.dp))
        if (filled) {
            PrimaryButton(buttonLabel, onClick, enabled = enabled, icon = icon)
        } else {
            SecondaryButton(buttonLabel, onClick, enabled = enabled, icon = icon)
        }
    }
}

@Composable
private fun Banner(text: String, background: Color, color: Color) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(background)
            .padding(12.dp),
    ) {
        Text(text, color = color, fontWeight = FontWeight.Medium, fontSize = 13.sp)
    }
}

private fun exportStatusLabel(status: String): String = when (status.lowercase()) {
    "pending" -> "Chờ duyệt"
    "approved" -> "Đã duyệt"
    "rejected" -> "Từ chối"
    else -> status
}

private val previewAssemble = AssembleStatus(
    orderId = 1,
    configName = "PC Văn phòng",
    description = "Cấu hình văn phòng cơ bản",
    quantity = 1,
    status = "in_progress",
    allEnough = true,
    missingCount = 0,
    materialExport = ExportTicket(1, "PXM-260924-012", "pending"),
    productExport = null,
    canRequestMaterial = false,
    canConfirmAssemble = true,
    canRequestProduct = false,
)

@Preview(showBackground = true, name = "Assemble")
@Composable
private fun AssemblePreview() {
    MrppcTheme {
        AssembleScreen(
            state = AssembleUiState(isLoading = false, status = previewAssemble),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}

@Preview(showBackground = true, name = "Assemble - xong")
@Composable
private fun AssembleDonePreview() {
    MrppcTheme {
        AssembleScreen(
            state = AssembleUiState(
                isLoading = false,
                status = previewAssemble.copy(
                    status = "done",
                    productExport = ExportTicket(2, "PXP-260924-008", "pending"),
                    canConfirmAssemble = false,
                    canRequestProduct = false,
                ),
                successMessage = "Đã gửi đề nghị xuất thành phẩm",
            ),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}

@Preview(showBackground = true, name = "Assemble - loading")
@Composable
private fun AssembleLoadingPreview() {
    MrppcTheme {
        AssembleScreen(
            state = AssembleUiState(isLoading = true),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}

@Preview(showBackground = true, name = "Assemble - lỗi")
@Composable
private fun AssembleErrorPreview() {
    MrppcTheme {
        AssembleScreen(
            state = AssembleUiState(isLoading = false, errorMessage = "Không thể tải thông tin lắp ráp"),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}
