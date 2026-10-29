package com.example.mrp_pc.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.BrandBlueLight
import com.example.mrp_pc.ui.theme.BrandBlueSoft
import com.example.mrp_pc.ui.theme.Danger
import com.example.mrp_pc.ui.theme.DangerSoft
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.Success
import com.example.mrp_pc.ui.theme.SuccessSoft
import com.example.mrp_pc.ui.theme.Warning
import com.example.mrp_pc.ui.theme.WarningSoft

@Composable
fun AppScreen(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val bg = MaterialTheme.colorScheme.background
    val primaryAlpha = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        primaryAlpha,
                        bg,
                        bg,
                    ),
                ),
            )
            .statusBarsPadding()
            .navigationBarsPadding(),
        content = content,
    )
}

@Composable
fun AppHeader(
    title: String,
    subtitle: String,
    leadingIcon: ImageVector? = null,
    onBack: (() -> Unit)? = null,
    trailing: @Composable (() -> Unit)? = null,
) {
    val safeOnBack = onBack?.let { rememberSingleClick(onClick = it) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = if (safeOnBack != null) 8.dp else 18.dp,
                    end = 18.dp,
                    top = 14.dp,
                    bottom = 14.dp,
                ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (safeOnBack != null) {
                IconButton(
                    onClick = safeOnBack,
                    modifier = Modifier.bounceClick(),
                ) {
                    Icon(
                        leadingIcon ?: Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Quay lại",
                        tint = MaterialTheme.colorScheme.onSurface,
                    )
                }
            } else if (leadingIcon != null) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
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
                        leadingIcon,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp),
                    )
                }
                Spacer(Modifier.width(14.dp))
            }

            Column(
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            trailing?.invoke()
        }
    }
}

@Composable
fun SectionCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.7f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        content = {
            Column(
                modifier = Modifier.padding(18.dp),
                content = content,
            )
        },
    )
}

@Composable
fun StatusChip(status: String) {
    val (label, color, bg) = when (status.lowercase()) {
        "pending" -> Triple("Chờ thực hiện", Warning, WarningSoft)
        "in_progress" -> Triple("Đang lắp ráp", BrandBlueLight, BrandBlueSoft)
        "done" -> Triple("Hoàn thành", Success, SuccessSoft)
        "approved" -> Triple("Đã duyệt", Success, SuccessSoft)
        "rejected" -> Triple("Từ chối", Danger, DangerSoft)
        else -> Triple(status, MaterialTheme.colorScheme.onSurfaceVariant, MaterialTheme.colorScheme.surfaceVariant)
    }

    Surface(
        shape = RoundedCornerShape(999.dp),
        color = color.copy(alpha = 0.12f),
        border = BorderStroke(1.dp, color.copy(alpha = 0.25f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(color),
            )
            Text(
                text = label,
                color = color,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
            )
        }
    }
}

@Composable
fun InfoPill(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .size(18.dp)
                        .padding(end = 6.dp),
                )
            }
            Column {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }
}

@Composable
fun ModernBanner(
    text: String,
    type: BannerType = BannerType.INFO,
    modifier: Modifier = Modifier,
) {
    val (icon, bg, fg) = when (type) {
        BannerType.SUCCESS -> Triple(Icons.Filled.CheckCircle, SuccessSoft, Success)
        BannerType.WARNING -> Triple(Icons.Filled.WarningAmber, WarningSoft, Warning)
        BannerType.DANGER -> Triple(Icons.Filled.ErrorOutline, DangerSoft, Danger)
        BannerType.INFO -> Triple(Icons.Filled.Info, BrandBlueSoft, BrandBlue)
    }

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = bg,
        border = BorderStroke(1.dp, fg.copy(alpha = 0.25f)),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = fg,
                modifier = Modifier.size(20.dp),
            )
            Text(
                text = text,
                color = fg,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                modifier = Modifier.weight(1f),
            )
        }
    }
}

enum class BannerType {
    SUCCESS, WARNING, DANGER, INFO
}

@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    message: String,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val debouncedAction = onAction?.let { rememberSingleClick(onClick = it) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(84.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.7f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(40.dp),
            )
        }
        Spacer(Modifier.height(20.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
        )
        if (actionLabel != null && debouncedAction != null) {
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = debouncedAction,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
                modifier = Modifier.bounceClick(),
            ) {
                Text(
                    text = actionLabel,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
fun LoadingState(
    text: String = "Đang tải dữ liệu...",
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(36.dp),
            color = MaterialTheme.colorScheme.primary,
            strokeWidth = 3.dp,
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    icon: ImageVector? = null,
) {
    val debouncedClick = rememberSingleClick(onClick = onClick)
    val isClickable = enabled && !isLoading

    Button(
        onClick = debouncedClick,
        enabled = isClickable,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .bounceClick(scaleDown = if (isClickable) 0.97f else 1f),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary,
            disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.38f),
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 2.dp,
            pressedElevation = 0.dp,
        ),
    ) {
        Crossfade(targetState = isLoading, label = "buttonLoading") { loading ->
            if (loading) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp,
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = "Đang xử lý...",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White,
                    )
                }
            } else {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    if (icon != null) {
                        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                    }
                    Text(
                        text = text,
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White,
                    )
                }
            }
        }
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    icon: ImageVector? = null,
) {
    val debouncedClick = rememberSingleClick(onClick = onClick)
    val isClickable = enabled && !isLoading

    OutlinedButton(
        onClick = debouncedClick,
        enabled = isClickable,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .bounceClick(scaleDown = if (isClickable) 0.97f else 1f),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(
            1.dp,
            if (isClickable) MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)
            else MaterialTheme.colorScheme.outlineVariant,
        ),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.Transparent,
            contentColor = MaterialTheme.colorScheme.primary,
            disabledContentColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
        ),
    ) {
        Crossfade(targetState = isLoading, label = "secondaryLoading") { loading ->
            if (loading) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.primary,
                        strokeWidth = 2.dp,
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = "Đang tải...",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            } else {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    if (icon != null) {
                        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                    }
                    Text(
                        text = text,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}

// -------------------------------------------------------------
// PREVIEWS FOR REUSABLE COMPONENTS (Light & Dark)
// -------------------------------------------------------------

@Preview(name = "App Components - Light", showBackground = true)
@Composable
private fun ComponentsLightPreview() {
    MrppcTheme(darkTheme = false) {
        Column(
            modifier = Modifier
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AppHeader(
                title = "Lệnh sản xuất",
                subtitle = "Quản lý lắp ráp xưởng PC",
                leadingIcon = Icons.AutoMirrored.Filled.Assignment,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusChip("pending")
                StatusChip("in_progress")
                StatusChip("done")
            }

            SectionCard {
                Text("Thông tin lệnh", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    InfoPill("Mã lệnh", "#00124", Modifier.weight(1f))
                    InfoPill("Số lượng", "3 bộ PC", Modifier.weight(1f))
                }
            }

            ModernBanner(text = "Đã gửi đề xuất xuất kho thành công!", type = BannerType.SUCCESS)
            ModernBanner(text = "Kho thiếu linh kiện, vui lòng kiểm tra!", type = BannerType.WARNING)

            PrimaryButton(text = "Xác nhận hoàn thành", onClick = {})
            PrimaryButton(text = "Đang tiến hành", onClick = {}, isLoading = true)
            SecondaryButton(text = "Kiểm tra tồn kho", onClick = {})
        }
    }
}

@Preview(name = "App Components - Dark", showBackground = true)
@Composable
private fun ComponentsDarkPreview() {
    MrppcTheme(darkTheme = true) {
        Column(
            modifier = Modifier
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AppHeader(
                title = "Lệnh sản xuất (Dark)",
                subtitle = "Quản lý lắp ráp xưởng PC",
                leadingIcon = Icons.AutoMirrored.Filled.Assignment,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusChip("pending")
                StatusChip("in_progress")
                StatusChip("done")
            }

            SectionCard {
                Text("Thông tin lệnh", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    InfoPill("Mã lệnh", "#00124", Modifier.weight(1f))
                    InfoPill("Số lượng", "3 bộ PC", Modifier.weight(1f))
                }
            }

            ModernBanner(text = "Đã gửi đề xuất xuất kho thành công!", type = BannerType.SUCCESS)
            PrimaryButton(text = "Xác nhận hoàn thành", onClick = {})
            SecondaryButton(text = "Kiểm tra tồn kho", onClick = {})
        }
    }
}

@Preview(name = "Empty State Preview", showBackground = true)
@Composable
private fun EmptyStatePreview() {
    MrppcTheme {
        EmptyState(
            icon = Icons.Filled.Inventory2,
            title = "Chưa có lệnh sản xuất",
            message = "Hiện tại bạn chưa được phân công lệnh lắp ráp nào mới.",
            actionLabel = "Làm mới danh sách",
            onAction = {},
        )
    }
}
