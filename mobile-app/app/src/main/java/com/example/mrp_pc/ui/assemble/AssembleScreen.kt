package com.example.mrp_pc.ui.assemble

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.AssembleStatus
import com.example.mrp_pc.domain.model.ExportTicket
import com.example.mrp_pc.ui.components.AppHeader
import com.example.mrp_pc.ui.components.AppScreen
import com.example.mrp_pc.ui.components.BannerType
import com.example.mrp_pc.ui.components.EmptyState
import com.example.mrp_pc.ui.components.InfoPill
import com.example.mrp_pc.ui.components.LoadingState
import com.example.mrp_pc.ui.components.ModernBanner
import com.example.mrp_pc.ui.components.PrimaryButton
import com.example.mrp_pc.ui.components.SecondaryButton
import com.example.mrp_pc.ui.components.SectionCard
import com.example.mrp_pc.ui.components.StatusChip
import com.example.mrp_pc.ui.components.rememberSingleClick
import com.example.mrp_pc.ui.theme.Danger
import com.example.mrp_pc.ui.theme.DangerSoft
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.Success
import com.example.mrp_pc.ui.theme.SuccessSoft
import com.example.mrp_pc.ui.theme.Warning
import com.example.mrp_pc.ui.theme.WarningSoft

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
            title = "Quy trình lắp ráp PC",
            subtitle = if (state.status != null) "Lệnh #${state.status.orderId} · 3 bước thực hiện" else "Tiến độ sản xuất",
            onBack = onBack,
        )

        when {
            state.isLoading && state.status == null -> LoadingState("Đang tải dữ liệu quy trình lắp ráp...")
            state.errorMessage != null && state.status == null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không tải được tiến độ",
                message = state.errorMessage,
                actionLabel = "Thử lại ngay",
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
    val debouncedRequestMaterial = rememberSingleClick(onClick = onRequestMaterial)
    val debouncedConfirmAssemble = rememberSingleClick(onClick = onConfirmAssemble)
    val debouncedRequestProduct = rememberSingleClick(onClick = onRequestProduct)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Main Order Info Card
        SectionCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    MaterialTheme.colorScheme.primary,
                                    MaterialTheme.colorScheme.secondary,
                                ),
                            ),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.Computer,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(26.dp),
                    )
                }

                Spacer(Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = status.configName,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (!status.description.isNullOrBlank()) {
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = status.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                Spacer(Modifier.width(8.dp))
                StatusChip(status.status)
            }

            Spacer(Modifier.height(14.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InfoPill("Mã lệnh", "#${status.orderId}", Modifier.weight(1f))
                InfoPill("Số lượng máy", "${status.quantity} bộ", Modifier.weight(1f))
            }
        }

        // Stock Readiness Notice
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = if (status.allEnough) SuccessSoft else WarningSoft,
            border = BorderStroke(1.dp, (if (status.allEnough) Success else Warning).copy(alpha = 0.25f)),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    imageVector = if (status.allEnough) Icons.Filled.CheckCircle else Icons.Filled.Inventory2,
                    contentDescription = null,
                    tint = if (status.allEnough) Success else Warning,
                    modifier = Modifier.size(20.dp),
                )
                Text(
                    text = if (status.allEnough)
                        "Kho đủ linh kiện. Tiến hành theo các bước bên dưới."
                    else
                        "Kho đang thiếu ${status.missingCount} loại linh kiện để lắp ráp.",
                    color = if (status.allEnough) Success else Warning,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                )
            }
        }

        // Banners
        AnimatedVisibility(
            visible = successMessage != null,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            if (successMessage != null) {
                ModernBanner(text = successMessage, type = BannerType.SUCCESS)
            }
        }

        AnimatedVisibility(
            visible = errorMessage != null,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            if (errorMessage != null) {
                ModernBanner(text = errorMessage, type = BannerType.DANGER)
            }
        }

        Text(
            text = "3 Bước Hoàn Tất Lệnh",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(top = 4.dp),
        )

        // STEP 1: Request Material
        StepCard(
            stepNumber = "1",
            icon = Icons.Filled.Inventory2,
            title = "Đề nghị xuất kho linh kiện",
            subtitle = "Lập phiếu xuất linh kiện (NVL) theo định mức BOM gửi thủ kho duyệt",
            ticket = status.materialExport,
            enabled = status.canRequestMaterial && !isWorking,
            isWorking = isWorking,
            buttonLabel = "Gửi đề nghị xuất NVL",
            isFilled = true,
            isCompleted = status.materialExport?.status.equals("approved", ignoreCase = true) || status.status == "done",
            onClick = debouncedRequestMaterial,
        )

        // STEP 2: Confirm Assemble
        StepCard(
            stepNumber = "2",
            icon = Icons.Filled.Build,
            title = "Xác nhận hoàn thành lắp ráp",
            subtitle = if (status.status == "done") "Đã hoàn thành lắp ráp và đóng lệnh" else "Trừ tồn kho linh kiện thực tế và đánh dấu hoàn thành",
            ticket = null,
            enabled = status.canConfirmAssemble && !isWorking,
            isWorking = isWorking,
            buttonLabel = "Xác nhận đã lắp ráp xong",
            isFilled = true,
            isCompleted = status.status.equals("done", ignoreCase = true),
            onClick = debouncedConfirmAssemble,
        )

        // STEP 3: Request Product Export
        StepCard(
            stepNumber = "3",
            icon = Icons.Filled.LocalShipping,
            title = "Đề nghị xuất thành phẩm",
            subtitle = "Lập phiếu xuất PC thành phẩm để bàn giao cho bộ phận kiểm định / giao hàng",
            ticket = status.productExport,
            enabled = status.canRequestProduct && !isWorking,
            isWorking = isWorking,
            buttonLabel = "Gửi đề nghị xuất thành phẩm",
            isFilled = false,
            isCompleted = status.productExport?.status.equals("approved", ignoreCase = true),
            onClick = debouncedRequestProduct,
        )
    }
}

@Composable
private fun StepCard(
    stepNumber: String,
    icon: ImageVector,
    title: String,
    subtitle: String,
    ticket: ExportTicket?,
    enabled: Boolean,
    isWorking: Boolean,
    buttonLabel: String,
    isFilled: Boolean,
    isCompleted: Boolean,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(
            1.dp,
            if (enabled) MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
            else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f),
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (enabled) 3.dp else 1.dp),
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(
                            if (isCompleted) Success
                            else if (enabled) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.primaryContainer,
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    if (isCompleted) {
                        Icon(
                            Icons.Filled.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp),
                        )
                    } else {
                        Text(
                            text = stepNumber,
                            color = if (enabled) Color.White else MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        )
                    }
                }

                Spacer(Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 16.sp,
                    )
                }
            }

            if (ticket != null) {
                Spacer(Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            text = "Mã phiếu: ${ticket.code}",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        TicketStatusBadge(ticket.status)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            if (isFilled) {
                PrimaryButton(
                    text = buttonLabel,
                    onClick = onClick,
                    enabled = enabled,
                    isLoading = isWorking && enabled,
                    icon = icon,
                )
            } else {
                SecondaryButton(
                    text = buttonLabel,
                    onClick = onClick,
                    enabled = enabled,
                    isLoading = isWorking && enabled,
                    icon = icon,
                )
            }
        }
    }
}

@Composable
private fun TicketStatusBadge(status: String) {
    val (label, color, bg) = when (status.lowercase()) {
        "pending" -> Triple("Chờ duyệt", Warning, WarningSoft)
        "approved" -> Triple("Đã duyệt", Success, SuccessSoft)
        "rejected" -> Triple("Từ chối", Danger, DangerSoft)
        else -> Triple(status, MaterialTheme.colorScheme.onSurfaceVariant, MaterialTheme.colorScheme.surfaceVariant)
    }

    Surface(
        shape = RoundedCornerShape(99.dp),
        color = bg,
    ) {
        Text(
            text = label,
            color = color,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

// -------------------------------------------------------------
// COMPLETE PREVIEWS FOR ASSEMBLE SCREEN (Light & Dark)
// -------------------------------------------------------------

private val previewAssemble = AssembleStatus(
    orderId = 101,
    configName = "PC Gaming RTX 4060 Ti",
    description = "Core i5-13400F · 32GB RAM DDR5 · SSD NVMe 1TB",
    quantity = 2,
    status = "pending",
    allEnough = true,
    missingCount = 0,
    materialExport = null,
    productExport = null,
    canRequestMaterial = true,
    canConfirmAssemble = false,
    canRequestProduct = false,
)

@Preview(name = "Assemble - Bước 1 Chờ xuất NVL (Light)", showBackground = true)
@Composable
private fun AssembleStep1LightPreview() {
    MrppcTheme(darkTheme = false) {
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

@Preview(name = "Assemble - Bước 1 Chờ xuất NVL (Dark)", showBackground = true)
@Composable
private fun AssembleStep1DarkPreview() {
    MrppcTheme(darkTheme = true) {
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

@Preview(name = "Assemble - Bước 2 Đã xuất NVL, sẵn sàng lắp", showBackground = true)
@Composable
private fun AssembleStep2Preview() {
    MrppcTheme(darkTheme = false) {
        AssembleScreen(
            state = AssembleUiState(
                isLoading = false,
                status = previewAssemble.copy(
                    status = "in_progress",
                    materialExport = ExportTicket(1, "PXM-260924-012", "approved"),
                    canRequestMaterial = false,
                    canConfirmAssemble = true,
                ),
            ),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}

@Preview(name = "Assemble - Bước 3 Lắp xong, xuất thành phẩm", showBackground = true)
@Composable
private fun AssembleStep3Preview() {
    MrppcTheme(darkTheme = false) {
        AssembleScreen(
            state = AssembleUiState(
                isLoading = false,
                status = previewAssemble.copy(
                    status = "done",
                    materialExport = ExportTicket(1, "PXM-260924-012", "approved"),
                    canRequestMaterial = false,
                    canConfirmAssemble = false,
                    canRequestProduct = true,
                ),
                successMessage = "Đã xác nhận hoàn thành lắp ráp PC!",
            ),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}

@Preview(name = "Assemble - Hoàn thành toàn bộ", showBackground = true)
@Composable
private fun AssembleDonePreview() {
    MrppcTheme(darkTheme = false) {
        AssembleScreen(
            state = AssembleUiState(
                isLoading = false,
                status = previewAssemble.copy(
                    status = "done",
                    materialExport = ExportTicket(1, "PXM-260924-012", "approved"),
                    productExport = ExportTicket(2, "PXP-260924-008", "approved"),
                    canRequestMaterial = false,
                    canConfirmAssemble = false,
                    canRequestProduct = false,
                ),
                successMessage = "Lệnh sản xuất đã hoàn tất toàn bộ quy trình.",
            ),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}

@Preview(name = "Assemble - Loading State", showBackground = true)
@Composable
private fun AssembleLoadingPreview() {
    MrppcTheme(darkTheme = false) {
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

@Preview(name = "Assemble - Error State", showBackground = true)
@Composable
private fun AssembleErrorPreview() {
    MrppcTheme(darkTheme = false) {
        AssembleScreen(
            state = AssembleUiState(
                isLoading = false,
                errorMessage = "Không thể kết nối đến máy chủ quản lý sản xuất",
            ),
            onBack = {},
            onRetry = {},
            onRequestMaterial = {},
            onConfirmAssemble = {},
            onRequestProduct = {},
        )
    }
}
