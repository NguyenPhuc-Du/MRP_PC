package com.example.mrp_pc.ui.stock

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Hardware
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.ComponentStock
import com.example.mrp_pc.domain.model.StockCheckResult
import com.example.mrp_pc.ui.components.AppHeader
import com.example.mrp_pc.ui.components.AppScreen
import com.example.mrp_pc.ui.components.EmptyState
import com.example.mrp_pc.ui.components.InfoPill
import com.example.mrp_pc.ui.components.LoadingState
import com.example.mrp_pc.ui.components.PrimaryButton
import com.example.mrp_pc.ui.components.SectionCard
import com.example.mrp_pc.ui.components.rememberSingleClick
import com.example.mrp_pc.ui.theme.Danger
import com.example.mrp_pc.ui.theme.DangerSoft
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.Success
import com.example.mrp_pc.ui.theme.SuccessSoft
import com.example.mrp_pc.ui.theme.Warning
import com.example.mrp_pc.ui.theme.WarningSoft

@Composable
fun StockScreen(
    state: StockUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onContinueAssemble: () -> Unit = {},
) {
    AppScreen {
        AppHeader(
            title = "Kiểm tra tồn kho linh kiện",
            subtitle = if (state.result != null) "Đối chiếu định mức BOM #${state.result.orderId}" else "Kiểm tra số lượng khả dụng",
            onBack = onBack,
        )

        when {
            state.isLoading && state.result == null -> LoadingState("Đang đối chiếu dữ liệu tồn kho...")
            state.errorMessage != null && state.result == null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không thể kiểm tra tồn kho",
                message = state.errorMessage,
                actionLabel = "Thử lại ngay",
                onAction = onRetry,
            )
            state.result != null -> StockContent(
                result = state.result,
                onContinueAssemble = onContinueAssemble,
            )
        }
    }
}

@Composable
private fun StockContent(
    result: StockCheckResult,
    onContinueAssemble: () -> Unit,
) {
    val debouncedContinue = rememberSingleClick(onClick = onContinueAssemble)

    Column(Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                StockSummaryCard(result)
            }

            item {
                Text(
                    text = "Danh sách linh kiện trong BOM (${result.items.size} loại)",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(top = 4.dp, bottom = 2.dp),
                )
            }

            items(result.items, key = { it.componentId }) { item ->
                StockItemCard(item)
            }
        }

        if (result.allEnough) {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                shadowElevation = 8.dp,
            ) {
                Box(Modifier.padding(16.dp)) {
                    PrimaryButton(
                        text = "Tiếp tục sang bước lắp ráp",
                        onClick = debouncedContinue,
                        icon = Icons.Filled.Build,
                    )
                }
            }
        }
    }
}

@Composable
private fun StockSummaryCard(result: StockCheckResult) {
    val ok = result.allEnough
    val enoughCount = result.items.count { it.isEnough }

    SectionCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    text = result.configName,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "Lệnh #${result.orderId} · Kế hoạch sản xuất: ${result.quantityRequested} bộ máy",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Surface(
                shape = RoundedCornerShape(99.dp),
                color = (if (ok) Success else Warning).copy(alpha = 0.12f),
            ) {
                Text(
                    text = "$enoughCount/${result.items.size} đủ",
                    color = if (ok) Success else Warning,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                )
            }
        }

        Spacer(Modifier.height(14.dp))

        // Banner Status
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = if (ok) SuccessSoft else WarningSoft,
            border = BorderStroke(1.dp, (if (ok) Success else Warning).copy(alpha = 0.25f)),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    imageVector = if (ok) Icons.Filled.CheckCircle else Icons.Filled.WarningAmber,
                    contentDescription = null,
                    tint = if (ok) Success else Warning,
                    modifier = Modifier.size(22.dp),
                )
                Text(
                    text = if (ok)
                        "Kho đầy đủ linh kiện, sẵn sàng đề xuất xuất kho và lắp ráp!"
                    else
                        "Kho thiếu linh kiện (${result.items.size - enoughCount} loại). Vui lòng thông báo thủ kho nhập thêm.",
                    color = if (ok) Success else Warning,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                )
            }
        }
    }
}

@Composable
private fun StockItemCard(item: ComponentStock) {
    val color = if (item.isEnough) Success else Danger
    val bg = if (item.isEnough) SuccessSoft else DangerSoft
    val progress = if (item.requiredQty <= 0) 1f else (item.onHandQty.toFloat() / item.requiredQty).coerceIn(0f, 1f)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f),
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(color.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Filled.Hardware,
                            contentDescription = null,
                            tint = color,
                            modifier = Modifier.size(20.dp),
                        )
                    }

                    Spacer(Modifier.width(10.dp))

                    Text(
                        text = item.componentName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }

                Surface(
                    shape = RoundedCornerShape(99.dp),
                    color = bg,
                ) {
                    Text(
                        text = if (item.isEnough) "Đủ linh kiện" else "Thiếu ${item.missingQty} ${item.unit ?: ""}",
                        color = color,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Progress Bar
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(99.dp)),
                color = color,
                trackColor = color.copy(alpha = 0.15f),
            )

            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = "Cần: ${item.requiredQty} ${item.unit ?: ""}",
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = "Tồn kho: ${item.onHandQty} ${item.unit ?: ""}",
                    style = MaterialTheme.typography.bodySmall,
                    color = color,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "BOM: ${item.bomQtyPerUnit}/máy",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

// -------------------------------------------------------------
// COMPLETE PREVIEWS FOR STOCK SCREEN (Light & Dark)
// -------------------------------------------------------------

private val previewStockResult = StockCheckResult(
    orderId = 101,
    configName = "PC Gaming RTX 4060 Ti",
    quantityRequested = 2,
    allEnough = true,
    items = listOf(
        ComponentStock(1, "CPU Intel Core i5-13400F Tray", "cái", 1, 2, 8, 0, true),
        ComponentStock(2, "Mainboard B760M DDR4", "cái", 1, 2, 4, 0, true),
        ComponentStock(3, "RAM Kingston Fury Beast 16GB DDR4", "thanh", 2, 4, 16, 0, true),
        ComponentStock(4, "VGA GeForce RTX 4060 Ti 8GB", "cái", 1, 2, 3, 0, true),
    ),
)

@Preview(name = "Stock - Đủ linh kiện (Light)", showBackground = true)
@Composable
private fun StockEnoughLightPreview() {
    MrppcTheme(darkTheme = false) {
        StockScreen(
            state = StockUiState(isLoading = false, result = previewStockResult),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "Stock - Đủ linh kiện (Dark)", showBackground = true)
@Composable
private fun StockEnoughDarkPreview() {
    MrppcTheme(darkTheme = true) {
        StockScreen(
            state = StockUiState(isLoading = false, result = previewStockResult),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "Stock - Thiếu linh kiện (Warning)", showBackground = true)
@Composable
private fun StockMissingPreview() {
    MrppcTheme(darkTheme = false) {
        StockScreen(
            state = StockUiState(
                isLoading = false,
                result = previewStockResult.copy(
                    allEnough = false,
                    items = listOf(
                        ComponentStock(1, "CPU Intel Core i5-13400F Tray", "cái", 1, 2, 1, 1, false),
                        ComponentStock(2, "Mainboard B760M DDR4", "cái", 1, 2, 4, 0, true),
                        ComponentStock(3, "RAM Kingston Fury Beast 16GB DDR4", "thanh", 2, 4, 2, 2, false),
                        ComponentStock(4, "VGA GeForce RTX 4060 Ti 8GB", "cái", 1, 2, 3, 0, true),
                    ),
                ),
            ),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "Stock - Loading State", showBackground = true)
@Composable
private fun StockLoadingPreview() {
    MrppcTheme(darkTheme = false) {
        StockScreen(
            state = StockUiState(isLoading = true),
            onBack = {},
            onRetry = {},
        )
    }
}

@Preview(name = "Stock - Error State", showBackground = true)
@Composable
private fun StockErrorPreview() {
    MrppcTheme(darkTheme = false) {
        StockScreen(
            state = StockUiState(
                isLoading = false,
                errorMessage = "Không thể kết nối đến máy chủ kho vật tư",
            ),
            onBack = {},
            onRetry = {},
        )
    }
}
