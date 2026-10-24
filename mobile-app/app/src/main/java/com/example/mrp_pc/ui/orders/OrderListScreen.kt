package com.example.mrp_pc.ui.orders

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.example.mrp_pc.ui.components.EmptyState
import com.example.mrp_pc.ui.components.InfoPill
import com.example.mrp_pc.ui.components.LoadingState
import com.example.mrp_pc.ui.components.StatusChip
import com.example.mrp_pc.ui.components.bounceClick
import com.example.mrp_pc.ui.components.clickableSingle
import com.example.mrp_pc.ui.components.rememberSingleClick
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.MrppcTheme

@Composable
fun OrderListScreen(
    orders: List<ProductionOrder>,
    isLoading: Boolean,
    onRetry: () -> Unit,
    onLogout: () -> Unit,
    onOrderClick: (Int) -> Unit,
    errorMessage: String? = null,
    selectedFilter: String = "ALL",
    onFilterChange: (String) -> Unit = {},
) {
    val debouncedLogout = rememberSingleClick(onClick = onLogout)
    val debouncedRetry = rememberSingleClick(onClick = onRetry)

    val displayedOrders = if (selectedFilter == "ALL") {
        orders
    } else {
        orders.filter { it.status.equals(selectedFilter, ignoreCase = true) }
    }

    AppScreen {
        AppHeader(
            title = "Lệnh sản xuất",
            subtitle = if (orders.isNotEmpty()) "${orders.size} lệnh được giao cho bạn" else "Xưởng lắp ráp PC",
            leadingIcon = Icons.AutoMirrored.Filled.Assignment,
            trailing = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = debouncedRetry,
                        modifier = Modifier.bounceClick(),
                    ) {
                        Icon(
                            Icons.Filled.Refresh,
                            contentDescription = "Làm mới",
                            tint = MaterialTheme.colorScheme.primary,
                        )
                    }
                    TextButton(
                        onClick = debouncedLogout,
                        modifier = Modifier.bounceClick(),
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Logout,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            "Đăng xuất",
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelLarge,
                        )
                    }
                }
            },
        )

        when {
            isLoading -> LoadingState("Đang tải danh sách lệnh sản xuất...")
            errorMessage != null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không thể tải danh sách lệnh",
                message = errorMessage,
                actionLabel = "Thử lại ngay",
                onAction = onRetry,
            )
            orders.isEmpty() -> EmptyState(
                icon = Icons.Filled.Inventory2,
                title = "Chưa có lệnh sản xuất",
                message = "Hiện tại bạn chưa được phân công lệnh lắp ráp nào.\nKhi quản lý kho bàn giao, lệnh sẽ hiển thị ở đây.",
                actionLabel = "Làm mới danh sách",
                onAction = onRetry,
            )
            else -> {
                // Filter Tabs Bar
                FilterChipsBar(
                    orders = orders,
                    selectedFilter = selectedFilter,
                    onFilterChange = onFilterChange,
                )

                if (displayedOrders.isEmpty()) {
                    EmptyState(
                        icon = Icons.Filled.FilterList,
                        title = "Không có lệnh nào",
                        message = "Không tìm thấy lệnh nào phù hợp với bộ lọc đã chọn.",
                        actionLabel = "Xem tất cả",
                        onAction = { onFilterChange("ALL") },
                    )
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        items(displayedOrders, key = { it.id }) { order ->
                            OrderCard(
                                order = order,
                                onClick = { onOrderClick(order.id) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterChipsBar(
    orders: List<ProductionOrder>,
    selectedFilter: String,
    onFilterChange: (String) -> Unit,
) {
    val pendingCount = orders.count { it.status.equals("pending", ignoreCase = true) }
    val inProgressCount = orders.count { it.status.equals("in_progress", ignoreCase = true) }
    val doneCount = orders.count { it.status.equals("done", ignoreCase = true) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        FilterItem(
            label = "Tất cả (${orders.size})",
            selected = selectedFilter == "ALL",
            onClick = { onFilterChange("ALL") },
        )
        FilterItem(
            label = "Chờ làm ($pendingCount)",
            selected = selectedFilter == "pending",
            onClick = { onFilterChange("pending") },
        )
        FilterItem(
            label = "Đang lắp ($inProgressCount)",
            selected = selectedFilter == "in_progress",
            onClick = { onFilterChange("in_progress") },
        )
        FilterItem(
            label = "Hoàn thành ($doneCount)",
            selected = selectedFilter == "done",
            onClick = { onFilterChange("done") },
        )
    }
}

@Composable
private fun FilterItem(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val debouncedClick = rememberSingleClick(onClick = onClick)
    val bgColor by animateColorAsState(
        targetValue = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
        label = "chipBg",
    )
    val contentColor by animateColorAsState(
        targetValue = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
        label = "chipColor",
    )

    Surface(
        shape = RoundedCornerShape(999.dp),
        color = bgColor,
        border = BorderStroke(
            1.dp,
            if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
        ),
        modifier = Modifier
            .bounceClick()
            .clickableSingle(onClick = debouncedClick),
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            style = MaterialTheme.typography.labelMedium.copy(
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            ),
            color = contentColor,
        )
    }
}

@Composable
private fun OrderCard(order: ProductionOrder, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .bounceClick()
            .clickableSingle(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.7f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                    MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f),
                                ),
                            ),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Filled.Computer,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp),
                    )
                }

                Spacer(Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = order.configName,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    if (!order.description.isNullOrBlank()) {
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = order.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                        )
                    }
                }

                Spacer(Modifier.width(8.dp))
                StatusChip(order.status)
            }

            Spacer(Modifier.height(14.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InfoPill(
                    label = "Số lượng",
                    value = "${order.quantity} máy",
                    modifier = Modifier.weight(1f),
                )
                InfoPill(
                    label = "Mã lệnh",
                    value = "#${order.id}",
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Tạo lúc: ${formatDateTime(order.createdAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        text = "Vào chi tiết",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }
    }
}

@Composable
fun SessionLoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
    ) {
        LoadingState("Đang xác thực phiên làm việc...")
    }
}

private fun formatDateTime(raw: String): String =
    raw.replace("T", " ").take(16).ifBlank { raw }

// -------------------------------------------------------------
// COMPLETE PREVIEWS FOR ORDER LIST (Light & Dark)
// -------------------------------------------------------------

private val sampleOrders = listOf(
    ProductionOrder(101, "PC Gaming RTX 4060", "i5-13400F · 16GB DDR4 · SSD 512GB", 2, "pending", "2026-09-18T08:30:00.000Z"),
    ProductionOrder(102, "PC Văn phòng Pro", "i3-12100 · 8GB DDR4 · SSD 256GB", 4, "in_progress", "2026-09-17T14:20:00.000Z"),
    ProductionOrder(103, "PC Đồ họa 3D Render", "Ryzen 9 7900X · RTX 4070Ti · 32GB DDR5", 1, "done", "2026-09-16T09:00:00.000Z"),
)

@Preview(name = "OrderList - Default (Light)", showBackground = true)
@Composable
private fun OrderListLightPreview() {
    MrppcTheme(darkTheme = false) {
        OrderListScreen(
            orders = sampleOrders,
            isLoading = false,
            onRetry = {},
            onLogout = {},
            onOrderClick = {},
        )
    }
}

@Preview(name = "OrderList - Default (Dark)", showBackground = true)
@Composable
private fun OrderListDarkPreview() {
    MrppcTheme(darkTheme = true) {
        OrderListScreen(
            orders = sampleOrders,
            isLoading = false,
            onRetry = {},
            onLogout = {},
            onOrderClick = {},
        )
    }
}

@Preview(name = "OrderList - Filtered (Đang lắp)", showBackground = true)
@Composable
private fun OrderListFilteredPreview() {
    MrppcTheme(darkTheme = false) {
        OrderListScreen(
            orders = sampleOrders,
            selectedFilter = "in_progress",
            isLoading = false,
            onRetry = {},
            onLogout = {},
            onOrderClick = {},
        )
    }
}

@Preview(name = "OrderList - Empty State", showBackground = true)
@Composable
private fun OrderListEmptyPreview() {
    MrppcTheme(darkTheme = false) {
        OrderListScreen(
            orders = emptyList(),
            isLoading = false,
            onRetry = {},
            onLogout = {},
            onOrderClick = {},
        )
    }
}

@Preview(name = "OrderList - Error State", showBackground = true)
@Composable
private fun OrderListErrorPreview() {
    MrppcTheme(darkTheme = false) {
        OrderListScreen(
            orders = emptyList(),
            isLoading = false,
            errorMessage = "Mất kết nối máy chủ quản lý xưởng",
            onRetry = {},
            onLogout = {},
            onOrderClick = {},
        )
    }
}

@Preview(name = "Session Loading Preview", showBackground = true)
@Composable
private fun SessionLoadingPreview() {
    MrppcTheme {
        SessionLoadingScreen()
    }
}
