package com.example.mrp_pc.ui.orders

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
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.ui.components.AppHeader
import com.example.mrp_pc.ui.components.AppScreen
import com.example.mrp_pc.ui.components.EmptyState
import com.example.mrp_pc.ui.components.InfoPill
import com.example.mrp_pc.ui.components.LoadingState
import com.example.mrp_pc.ui.components.PrimaryButton
import com.example.mrp_pc.ui.components.SecondaryButton
import com.example.mrp_pc.ui.components.SectionCard
import com.example.mrp_pc.ui.components.StatusChip
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.BrandBlueSoft
import com.example.mrp_pc.ui.theme.Ink
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.MutedText
import com.example.mrp_pc.ui.theme.Success
import com.example.mrp_pc.ui.theme.SuccessSoft

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
            title = "Chi tiết lệnh",
            subtitle = "Thông tin lắp ráp được giao",
            onBack = onBack,
        )

        when {
            state.isLoading -> LoadingState("Đang tải chi tiết lệnh...")
            state.errorMessage != null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không tải được chi tiết",
                message = state.errorMessage,
                actionLabel = "Thử lại",
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
    val canWork = order.status.lowercase() != "done"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionCard {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text(order.configName, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Ink)
                    if (!order.description.isNullOrBlank()) {
                        Spacer(Modifier.height(6.dp))
                        Text(order.description, fontSize = 14.sp, color = MutedText, lineHeight = 20.sp)
                    }
                }
                StatusChip(order.status)
            }
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InfoPill("Mã lệnh", "#${order.id}", Modifier.weight(1f))
                InfoPill("Số lượng", "${order.quantity} máy", Modifier.weight(1f))
            }
            Spacer(Modifier.height(10.dp))
            InfoPill("Thời gian tạo", formatDetailDateTime(order.createdAt), Modifier.fillMaxWidth())
        }

        SectionCard {
            Text("Quy trình làm việc", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Ink)
            Spacer(Modifier.height(14.dp))
            StepRow("1", "Kiểm tra tồn kho", "Đối chiếu BOM với số lượng trong kho")
            StepRow("2", "Đề nghị xuất linh kiện", "Gửi phiếu xuất NVL cho quản lý kho")
            StepRow("3", "Xác nhận lắp xong", "Hoàn thành lệnh và xin xuất thành phẩm")
        }

        if (canWork) {
            PrimaryButton("Kiểm tra tồn kho", onCheckStock, icon = Icons.Filled.Inventory2)
            SecondaryButton("Bắt đầu lắp ráp", onAssemble, icon = Icons.Filled.Build)
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(SuccessSoft)
                    .padding(16.dp),
            ) {
                Text("Lệnh này đã hoàn thành.", color = Success, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun StepRow(number: String, title: String, subtitle: String) {
    Row(
        modifier = Modifier.padding(bottom = 12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .clip(CircleShape)
                .background(BrandBlueSoft),
            contentAlignment = Alignment.Center,
        ) {
            Text(number, color = BrandBlue, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Ink)
            Text(subtitle, fontSize = 13.sp, color = MutedText, lineHeight = 18.sp)
        }
    }
}

private fun formatDetailDateTime(raw: String): String =
    raw.replace("T", " ").take(16).ifBlank { raw }

@Preview(showBackground = true, name = "OrderDetail")
@Composable
private fun OrderDetailPreview() {
    MrppcTheme {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                order = ProductionOrder(
                    id = 1,
                    configName = "PC Gaming RTX 4060",
                    description = "i5-13400F + 16GB DDR4 + SSD 512GB",
                    quantity = 2,
                    status = "pending",
                    createdAt = "2026-09-18T08:30:00.000Z",
                ),
            ),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderDetail - xong")
@Composable
private fun OrderDetailDonePreview() {
    MrppcTheme {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                order = ProductionOrder(
                    id = 3,
                    configName = "PC Văn phòng",
                    description = "Đã lắp xong",
                    quantity = 1,
                    status = "done",
                    createdAt = "2026-09-16T09:00:00.000Z",
                ),
            ),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderDetail - loading")
@Composable
private fun OrderDetailLoadingPreview() {
    MrppcTheme {
        OrderDetailScreen(
            state = OrderDetailUiState(isLoading = true),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderDetail - lỗi")
@Composable
private fun OrderDetailErrorPreview() {
    MrppcTheme {
        OrderDetailScreen(
            state = OrderDetailUiState(
                isLoading = false,
                errorMessage = "Không thể tải chi tiết lệnh",
            ),
            onBack = {},
            onRetry = {},
        )
    }
}
