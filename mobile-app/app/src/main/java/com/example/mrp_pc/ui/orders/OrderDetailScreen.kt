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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
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
fun OrderDetailScreen(
    state: OrderDetailUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onCheckStock: () -> Unit = {},
    onAssemble: () -> Unit = {},
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg),
    ) {
        DetailHeader(onBack = onBack)

        when {
            state.isLoading -> {
                DetailStateBox {
                    CircularProgressIndicator(color = BrandBlue)
                    Spacer(Modifier.height(12.dp))
                    Text("Đang tải chi tiết lệnh...", color = MutedText, fontSize = 14.sp)
                }
            }

            state.errorMessage != null -> {
                DetailStateBox {
                    DetailStatusIcon(
                        icon = Icons.Filled.Refresh,
                        background = BrandBlue.copy(alpha = 0.12f),
                        tint = BrandBlue,
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = state.errorMessage,
                        color = Color(0xFF374151),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = onRetry,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                    ) {
                        Icon(Icons.Filled.Refresh, null, Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Thử lại")
                    }
                }
            }

            state.order != null -> {
                OrderDetailContent(
                    order = state.order,
                    onCheckStock = onCheckStock,
                    onAssemble = onAssemble,
                )
            }
        }
    }
}

@Composable
private fun DetailHeader(onBack: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Quay lại",
                    tint = Color(0xFF111827),
                )
            }
            Column {
                Text(
                    text = "Chi tiết lệnh",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF111827),
                )
                Text(
                    text = "Thông tin lắp ráp được giao",
                    fontSize = 13.sp,
                    color = MutedText,
                )
            }
        }
    }
}

@Composable
private fun OrderDetailContent(
    order: ProductionOrder,
    onCheckStock: () -> Unit,
    onAssemble: () -> Unit,
) {
    val statusColor = detailStatusColor(order.status)
    val canWork = order.status.lowercase() != "done"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Card chính
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            text = order.configName,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF111827),
                        )
                        if (!order.description.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = order.description,
                                fontSize = 14.sp,
                                color = MutedText,
                                lineHeight = 20.sp,
                            )
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    DetailStatusChip(
                        text = detailStatusLabel(order.status),
                        color = statusColor,
                    )
                }

                Spacer(Modifier.height(16.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DetailInfoPill(
                        label = "Mã lệnh",
                        value = "#${order.id}",
                        modifier = Modifier.weight(1f),
                    )
                    DetailInfoPill(
                        label = "Số lượng",
                        value = "${order.quantity} máy",
                        modifier = Modifier.weight(1f),
                    )
                }

                Spacer(Modifier.height(10.dp))

                DetailInfoPill(
                    label = "Thời gian tạo",
                    value = formatDetailDateTime(order.createdAt),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        // Hướng dẫn bước làm
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(
                    text = "Quy trình làm việc",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF111827),
                )
                Spacer(Modifier.height(12.dp))
                StepRow(number = "1", title = "Kiểm tra tồn kho", subtitle = "Xem linh kiện theo BOM còn đủ không")
                Spacer(Modifier.height(10.dp))
                StepRow(number = "2", title = "Đề nghị xuất linh kiện", subtitle = "Xin kho cấp NVL để lắp ráp")
                Spacer(Modifier.height(10.dp))
                StepRow(number = "3", title = "Xác nhận lắp xong", subtitle = "Hoàn thành lệnh và xin xuất thành phẩm")
            }
        }

        // Nút thao tác
        if (canWork) {
            Button(
                onClick = onCheckStock,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
            ) {
                Icon(Icons.Filled.Inventory2, null, Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text("Kiểm tra tồn kho", fontWeight = FontWeight.SemiBold)
            }

            OutlinedButton(
                onClick = onAssemble,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
            ) {
                Icon(Icons.Filled.Build, null, Modifier.size(20.dp), tint = BrandBlue)
                Spacer(Modifier.width(8.dp))
                Text("Bắt đầu lắp ráp", color = BrandBlue, fontWeight = FontWeight.SemiBold)
            }
        } else {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
            ) {
                Text(
                    text = "Lệnh này đã hoàn thành.",
                    modifier = Modifier.padding(16.dp),
                    color = Color(0xFF059669),
                    fontWeight = FontWeight.Medium,
                )
            }
        }

        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun StepRow(number: String, title: String, subtitle: String) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(BrandBlue.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(number, color = BrandBlue, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Color(0xFF111827))
            Text(subtitle, fontSize = 13.sp, color = MutedText, lineHeight = 18.sp)
        }
    }
}

@Composable
private fun DetailStatusChip(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(text, color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun DetailInfoPill(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(PageBg)
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Text(label, fontSize = 11.sp, color = MutedText)
        Spacer(Modifier.height(2.dp))
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF111827))
    }
}

@Composable
private fun DetailStatusIcon(icon: ImageVector, background: Color, tint: Color) {
    Box(
        modifier = Modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(background),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(32.dp))
    }
}

@Composable
private fun DetailStateBox(content: @Composable () -> Unit) {
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

private fun detailStatusLabel(status: String): String = when (status.lowercase()) {
    "pending" -> "Chờ làm"
    "in_progress" -> "Đang lắp"
    "done" -> "Hoàn thành"
    else -> status
}

private fun detailStatusColor(status: String): Color = when (status.lowercase()) {
    "pending" -> Color(0xFFD97706)
    "in_progress" -> BrandBlue
    "done" -> Color(0xFF059669)
    else -> MutedText
}

private fun formatDetailDateTime(raw: String): String =
    raw.replace("T", " ").take(16).ifBlank { raw }

@Preview(showBackground = true, name = "OrderDetail - data")
@Composable
private fun OrderDetailPreview() {
    MrppcTheme(dynamicColor = false) {
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

@Preview(showBackground = true, name = "OrderDetail - loading")
@Composable
private fun OrderDetailLoadingPreview() {
    MrppcTheme(dynamicColor = false) {
        OrderDetailScreen(
            state = OrderDetailUiState(isLoading = true),
            onBack = {},
            onRetry = {},
        )
    }
}