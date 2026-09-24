package com.example.mrp_pc.ui.stock

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.domain.model.ComponentStock
import com.example.mrp_pc.domain.model.StockCheckResult
import com.example.mrp_pc.ui.components.AppHeader
import com.example.mrp_pc.ui.components.AppScreen
import com.example.mrp_pc.ui.components.EmptyState
import com.example.mrp_pc.ui.components.LoadingState
import com.example.mrp_pc.ui.components.PrimaryButton
import com.example.mrp_pc.ui.components.SectionCard
import com.example.mrp_pc.ui.theme.Danger
import com.example.mrp_pc.ui.theme.Ink
import com.example.mrp_pc.ui.theme.MutedText
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
            title = "Kiểm tra tồn kho",
            subtitle = "Đối chiếu BOM với kho",
            onBack = onBack,
        )

        when {
            state.isLoading -> LoadingState("Đang đối chiếu tồn kho...")
            state.errorMessage != null -> EmptyState(
                icon = Icons.Filled.Refresh,
                title = "Không kiểm tra được kho",
                message = state.errorMessage,
                actionLabel = "Thử lại",
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
    Column(Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item { SummaryCard(result) }
            items(result.items, key = { it.componentId }) { item ->
                StockItemCard(item)
            }
        }

        if (result.allEnough) {
            Box(Modifier.padding(16.dp)) {
                PrimaryButton("Tiếp tục lắp ráp", onContinueAssemble, icon = Icons.Filled.Build)
            }
        }
    }
}

@Composable
private fun SummaryCard(result: StockCheckResult) {
    val ok = result.allEnough
    SectionCard {
        Text(result.configName, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Ink)
        Text("Lệnh #${result.orderId} · ${result.quantityRequested} máy", color = MutedText, fontSize = 13.sp)
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (ok) SuccessSoft else WarningSoft)
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(if (ok) Icons.Filled.CheckCircle else Icons.Filled.Warning, null, tint = if (ok) Success else Warning)
            Spacer(Modifier.width(8.dp))
            Text(
                if (ok) "Đủ linh kiện để lắp" else "Thiếu linh kiện — báo kho nhập thêm",
                color = if (ok) Success else Warning,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
            )
        }
    }
}

@Composable
private fun StockItemCard(item: ComponentStock) {
    val color = if (item.isEnough) Success else Danger
    val progress = if (item.requiredQty <= 0) 1f else (item.onHandQty.toFloat() / item.requiredQty).coerceIn(0f, 1f)

    SectionCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(item.componentName, fontWeight = FontWeight.SemiBold, color = Ink, modifier = Modifier.weight(1f))
            Text(
                if (item.isEnough) "Đủ" else "Thiếu ${item.missingQty}",
                color = color,
                fontWeight = FontWeight.SemiBold,
                fontSize = 13.sp,
            )
        }
        Spacer(Modifier.height(10.dp))
        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(99.dp)),
            color = color,
            trackColor = color.copy(alpha = 0.12f),
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Cần ${item.requiredQty} ${item.unit ?: ""}  ·  Tồn ${item.onHandQty}  ·  BOM ${item.bomQtyPerUnit}/máy",
            color = MutedText,
            fontSize = 12.sp,
        )
    }
}
