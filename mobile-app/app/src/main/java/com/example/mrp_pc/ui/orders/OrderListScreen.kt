package com.example.mrp_pc.ui.orders

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.example.mrp_pc.ui.components.StatusChip
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.CardWhite
import com.example.mrp_pc.ui.theme.Ink
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.MutedText

@Composable
fun OrderListScreen(
    orders: List<ProductionOrder>,
    isLoading: Boolean,
    onRetry: () -> Unit,
    onLogout: () -> Unit,
    onOrderClick: (Int) -> Unit,
    errorMessage: String? = null,
) {
    AppScreen {
        AppHeader(
            title = "Lệnh sản xuất",
            subtitle = if (orders.isNotEmpty()) "${orders.size} lệnh đang giao" else "Nhân viên lắp ráp",
            leadingIcon = Icons.Filled.Assignment,
            trailing = {
                TextButton(onClick = onLogout) {
                    Icon(Icons.AutoMirrored.Filled.Logout, null, tint = BrandBlue, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Đăng xuất", color = BrandBlue, fontWeight = FontWeight.Medium)
                }
            },
        )

        when {
            isLoading -> LoadingState("Đang tải lệnh sản xuất...")
            errorMessage != null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không tải được danh sách",
                message = errorMessage,
                actionLabel = "Thử lại",
                onAction = onRetry,
            )
            orders.isEmpty() -> EmptyState(
                icon = Icons.Filled.Inventory2,
                title = "Chưa có lệnh được giao",
                message = "Khi quản lý kho giao lệnh lắp ráp,\nbạn sẽ thấy danh sách tại đây.",
                actionLabel = "Làm mới",
                onAction = onRetry,
            )
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(orders, key = { it.id }) { order ->
                    OrderCard(order = order, onClick = { onOrderClick(order.id) })
                }
            }
        }
    }
}

@Composable
private fun OrderCard(order: ProductionOrder, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text(order.configName, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                    if (!order.description.isNullOrBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(order.description, fontSize = 13.sp, color = MutedText, lineHeight = 18.sp)
                    }
                }
                Spacer(Modifier.width(8.dp))
                StatusChip(order.status)
            }

            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InfoPill("Số lượng", "${order.quantity} máy", Modifier.weight(1f))
                InfoPill("Mã lệnh", "#${order.id}", Modifier.weight(1f))
            }

            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Tạo lúc ${formatDateTime(order.createdAt)}", fontSize = 12.sp, color = MutedText, modifier = Modifier.weight(1f))
                Text("Xem chi tiết", fontSize = 13.sp, color = BrandBlue, fontWeight = FontWeight.Medium)
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = BrandBlue, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
fun SessionLoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(com.example.mrp_pc.ui.theme.PageBg),
        contentAlignment = Alignment.Center,
    ) {
        LoadingState("Đang kiểm tra phiên...")
    }
}

private fun formatDateTime(raw: String): String =
    raw.replace("T", " ").take(16).ifBlank { raw }

@Preview(showBackground = true, name = "OrderList")
@Composable
private fun OrderListPreview() {
    MrppcTheme {
        OrderListScreen(
            orders = listOf(
                ProductionOrder(1, "PC Văn phòng", "Cấu hình cơ bản", 2, "pending", "2026-09-18T08:30:00.000Z"),
                ProductionOrder(2, "PC Gaming", "RTX 4060 + i5", 1, "in_progress", "2026-09-17T14:20:00.000Z"),
                ProductionOrder(3, "PC Đồ họa", "Ryzen 7 + 32GB", 1, "done", "2026-09-16T09:00:00.000Z"),
            ),
            isLoading = false,
            onLogout = {},
            onRetry = {},
            onOrderClick = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderList - trống")
@Composable
private fun OrderListEmptyPreview() {
    MrppcTheme {
        OrderListScreen(
            orders = emptyList(),
            isLoading = false,
            onLogout = {},
            onRetry = {},
            onOrderClick = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderList - lỗi")
@Composable
private fun OrderListErrorPreview() {
    MrppcTheme {
        OrderListScreen(
            orders = emptyList(),
            isLoading = false,
            errorMessage = "Không thể tải danh sách lệnh",
            onLogout = {},
            onRetry = {},
            onOrderClick = {},
        )
    }
}

@Preview(showBackground = true, name = "Session loading")
@Composable
private fun SessionLoadingPreview() {
    MrppcTheme {
        SessionLoadingScreen()
    }
}
