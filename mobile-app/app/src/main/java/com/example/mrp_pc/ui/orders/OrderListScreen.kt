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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.MutedText
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.PageBg

@Composable
fun OrderListScreen(
    orders: List<ProductionOrder>,
    isLoading: Boolean,
    onRetry: () -> Unit,
    onLogout: () -> Unit,
    errorMessage: String? = null,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg),
    ) {
        OrdersHeader(
            orderCount = orders.size,
            onLogout = onLogout,
        )

        when {
            isLoading -> {
                StateBox {
                    CircularProgressIndicator(color = BrandBlue)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Đang tải lệnh sản xuất...", color = MutedText, fontSize = 14.sp)
                }
            }

            errorMessage != null -> {
                StateBox {
                    StatusIcon(Icons.Filled.Refresh, BrandBlue.copy(alpha = 0.12f), BrandBlue)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = errorMessage,
                        color = Color(0xFF374151),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onRetry,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                    ) {
                        Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Thử lại")
                    }
                }
            }

            orders.isEmpty() -> {
                StateBox {
                    StatusIcon(Icons.Filled.Inventory2, BrandBlue.copy(alpha = 0.12f), BrandBlue)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Chưa có lệnh được giao",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF111827),
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Khi quản lý kho giao lệnh lắp ráp,\nbạn sẽ thấy danh sách tại đây.",
                        color = MutedText,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp,
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedButton(
                        onClick = onRetry,
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        Text("Làm mới", color = BrandBlue)
                    }
                }
            }

            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    items(orders, key = { it.id }) { order ->
                        OrderCard(order = order)
                    }
                }
            }
        }
    }
}

@Composable
private fun OrdersHeader(
    orderCount: Int,
    onLogout: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(BrandBlue),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Assignment,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp),
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Lệnh sản xuất",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF111827),
                    )
                    Text(
                        text = if (orderCount > 0) "$orderCount lệnh đang giao" else "Nhân viên lắp ráp",
                        fontSize = 13.sp,
                        color = MutedText,
                    )
                }
            }

            TextButton(onClick = onLogout) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    tint = BrandBlue,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Đăng xuất", color = BrandBlue, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun OrderCard(order: ProductionOrder) {
    val statusColor = statusColor(order.status)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = order.configName,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF111827),
                    )
                    if (!order.description.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = order.description,
                            fontSize = 13.sp,
                            color = MutedText,
                            lineHeight = 18.sp,
                        )
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                StatusChip(text = statusLabel(order.status), color = statusColor)
            }

            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InfoPill(label = "Số lượng", value = "${order.quantity}")
                InfoPill(label = "Mã lệnh", value = "#${order.id}")
            }

            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "Tạo lúc: ${formatDateTime(order.createdAt)}",
                fontSize = 12.sp,
                color = MutedText,
            )
        }
    }
}

@Composable
private fun StatusChip(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun InfoPill(label: String, value: String) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(PageBg)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Text(label, fontSize = 11.sp, color = MutedText)
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF111827))
    }
}

@Composable
private fun StatusIcon(icon: ImageVector, background: Color, tint: Color) {
    Box(
        modifier = Modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(background),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(32.dp),
        )
    }
}

@Composable
private fun StateBox(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        content()
    }
}

@Composable
fun SessionLoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(color = BrandBlue)
    }
}

private fun statusLabel(status: String): String = when (status.lowercase()) {
    "pending" -> "Chờ làm"
    "in_progress" -> "Đang lắp"
    "done" -> "Hoàn thành"
    else -> status
}

private fun statusColor(status: String): Color = when (status.lowercase()) {
    "pending" -> Color(0xFFD97706)
    "in_progress" -> BrandBlue
    "done" -> Color(0xFF059669)
    else -> MutedText
}

private fun formatDateTime(raw: String): String {
    return raw
        .replace("T", " ")
        .take(16)
        .ifBlank { raw }
}

@Preview(showBackground = true, name = "OrderList - empty")
@Composable
private fun OrderListScreenPreview() {
    MrppcTheme(dynamicColor = false) {
        OrderListScreen(
            orders = emptyList(),
            isLoading = false,
            onLogout = {},
            onRetry = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderList - with data")
@Composable
private fun OrderListWithDataPreview() {
    MrppcTheme(dynamicColor = false) {
        OrderListScreen(
            orders = listOf(
                ProductionOrder(
                    id = 1,
                    configName = "PC Văn phòng",
                    description = "Cấu hình cơ bản cho nhân viên",
                    quantity = 2,
                    status = "pending",
                    createdAt = "2026-09-18T08:30:00.000Z",
                ),
                ProductionOrder(
                    id = 2,
                    configName = "PC Gaming",
                    description = "RTX 4060 + i5-13400F",
                    quantity = 1,
                    status = "in_progress",
                    createdAt = "2026-09-17T14:20:00.000Z",
                ),
            ),
            isLoading = false,
            onLogout = {},
            onRetry = {},
        )
    }
}

@Preview(showBackground = true, name = "OrderList - error")
@Composable
private fun OrderListErrorPreview() {
    MrppcTheme(dynamicColor = false) {
        OrderListScreen(
            orders = emptyList(),
            isLoading = false,
            errorMessage = "Không thể tải danh sách lệnh",
            onLogout = {},
            onRetry = {},
        )
    }
}
