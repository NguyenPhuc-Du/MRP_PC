package com.example.mrp_pc.ui.orders

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
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.ProductionOrder
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
import com.example.mrp_pc.ui.theme.MrppcTheme

@Composable
fun OrderDetailScreen(
    state: OrderDetailUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onCheckStock: () -> Unit = {},
    onAssemble: () -> Unit = {},
) {
    AppScreen {
        AppHeader(
            title = "Chi tiết lệnh sản xuất",
            subtitle = if (state.order != null) "Mã lệnh #${state.order.id}" else "Thông tin lắp ráp",
            onBack = onBack,
        )

        when {
            state.isLoading && state.order == null -> LoadingState("Đang tải chi tiết lệnh...")
            state.errorMessage != null && state.order == null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không thể tải chi tiết",
                message = state.errorMessage,
                actionLabel = "Thử lại ngay",
                onAction = onRetry,
            )
            state.order != null -> OrderDetailContent(
                order = state.order,
                onCheckStock = onCheckStock,
                onAssemble = onAssemble,
            )
        }
    }
}

@Composable
private fun OrderDetailContent(
    order: ProductionOrder,
    onCheckStock: () -> Unit,
    onAssemble: () -> Unit,
) {
    val canWork = !order.status.equals("done", ignoreCase = true)
    val debouncedCheckStock = rememberSingleClick(onClick = onCheckStock)
    val debouncedAssemble = rememberSingleClick(onClick = onAssemble)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        // Main Configuration Spec Card
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
                        text = order.configName,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (!order.description.isNullOrBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = order.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 20.sp,
                        )
                    }
                }

                Spacer(Modifier.width(8.dp))
                StatusChip(order.status)
            }

            Spacer(Modifier.height(18.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InfoPill(
                    label = "Mã lệnh",
                    value = "#${order.id}",
                    modifier = Modifier.weight(1f),
                )
                InfoPill(
                    label = "Số lượng",
                    value = "${order.quantity} bộ PC",
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(Modifier.height(10.dp))

            InfoPill(
                label = "Thời điểm giao lệnh",
                value = formatDetailDateTime(order.createdAt),
                modifier = Modifier.fillMaxWidth(),
                icon = Icons.Filled.Schedule,
            )
        }

        // Standard Workflow Steps Stepper
        SectionCard {
            Text(
                text = "Quy trình thực hiện chuẩn",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(16.dp))

            WorkflowStepRow(
                stepNumber = "1",
                title = "Kiểm tra tồn kho linh kiện (BOM)",
                subtitle = "Đối chiếu danh mục nguyên vật liệu với số lượng khả dụng trong kho",
                isCompleted = order.status.equals("in_progress", ignoreCase = true) || order.status.equals("done", ignoreCase = true),
                isLast = false,
            )

            WorkflowStepRow(
                stepNumber = "2",
                title = "Đề nghị xuất kho & Lắp ráp",
                subtitle = "Gửi phiếu xuất NVL tới thủ kho và tiến hành lắp đặt phần cứng",
                isCompleted = order.status.equals("done", ignoreCase = true),
                isLast = false,
            )

            WorkflowStepRow(
                stepNumber = "3",
                title = "Xác nhận hoàn thành & Bàn giao",
                subtitle = "Trừ kho linh kiện, hoàn tất lắp ráp và lập phiếu xuất thành phẩm",
                isCompleted = order.status.equals("done", ignoreCase = true),
                isLast = true,
            )
        }

        // Action Buttons
        if (canWork) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                PrimaryButton(
                    text = "Bắt đầu lắp ráp",
                    onClick = debouncedAssemble,
                    icon = Icons.Filled.Build,
                )
                SecondaryButton(
                    text = "Kiểm tra tồn kho linh kiện",
                    onClick = debouncedCheckStock,
                    icon = Icons.Filled.Inventory2,
                )
            }
        } else {
            ModernBanner(
                text = "Lệnh sản xuất này đã hoàn thành và bàn giao thành phẩm thành công.",
                type = BannerType.SUCCESS,
            )
        }
    }
}

@Composable
private fun WorkflowStepRow(
    stepNumber: String,
    title: String,
    subtitle: String,
    isCompleted: Boolean,
    isLast: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(
                        if (isCompleted) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.primaryContainer,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                if (isCompleted) {
                    Icon(
                        Icons.Filled.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp),
                    )
                } else {
                    Text(
                        text = stepNumber,
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    )
                }
            }

            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(38.dp)
                        .background(MaterialTheme.colorScheme.outlineVariant),
                )
            }
        }

        Spacer(Modifier.width(14.dp))

        Column(modifier = Modifier.padding(bottom = if (!isLast) 14.dp else 0.dp)) {
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
                lineHeight = 18.sp,
            )
        }
    }
}

private fun formatDetailDateTime(raw: String): String =
    raw.replace("T", " ").take(16).ifBlank { raw }

// -------------------------------------------------------------
// COMPLETE PREVIEWS FOR ORDER DETAIL (Light & Dark)
// -------------------------------------------------------------

private val sampleDetailOrder = ProductionOrder(
    id = 101,
    configName = "PC Gaming RTX 4060 Ti",
    description = "Core i5-13400F · 32GB RAM DDR5 · SSD NVMe 1TB · Nguồn 750W Gold",
    quantity = 2,
    status = "in_progress",
    createdAt = "2026-09-18T08:30:00.000Z",
)

@Preview(name = "OrderDetail - In Progress (Light)", showBackground = true)
@Composable
private fun OrderDetailLightPreview() {
    MrppcTheme(darkTheme = false) {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                order = sampleDetailOrder,
            ),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "OrderDetail - In Progress (Dark)", showBackground = true)
@Composable
private fun OrderDetailDarkPreview() {
    MrppcTheme(darkTheme = true) {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                order = sampleDetailOrder,
            ),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "OrderDetail - Completed (Done)", showBackground = true)
@Composable
private fun OrderDetailDonePreview() {
    MrppcTheme(darkTheme = false) {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                order = sampleDetailOrder.copy(status = "done"),
            ),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "OrderDetail - Loading State", showBackground = true)
@Composable
private fun OrderDetailLoadingPreview() {
    MrppcTheme(darkTheme = false) {
        OrderDetailScreen(
            state = OrderDetailUiState(isLoading = true),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "OrderDetail - Error State", showBackground = true)
@Composable
private fun OrderDetailErrorPreview() {
    MrppcTheme(darkTheme = false) {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                errorMessage = "Không tìm thấy thông tin lệnh hoặc đã bị xóa khỏi hệ thống",
            ),
            onBack = {},
            onRetry = {},
        )
    }
}
