package com.example.mrp_pc.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Default palette
val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)

// Brand Core Colors
val BrandBlue = Color(0xFF2563EB)
val BrandBlueDark = Color(0xFF1D4ED8)
val BrandBlueLight = Color(0xFF3B82F6)
val BrandBlueSoft = Color(0xFFEFF6FF)
val BrandIndigo = Color(0xFF4F46E5)
val BrandCyan = Color(0xFF06B6D4)

// Light Palette
val PageBg = Color(0xFFF8FAFC)
val CardWhite = Color(0xFFFFFFFF)
val CardElevated = Color(0xFFF1F5F9)
val FieldBorder = Color(0xFFE2E8F0)
val Ink = Color(0xFF0F172A)
val MutedText = Color(0xFF64748B)

// Dark Palette
val DarkBg = Color(0xFF0A0E17)
val DarkSurface = Color(0xFF121826)
val DarkSurfaceElevated = Color(0xFF1A2234)
val DarkBorder = Color(0xFF253046)
val DarkInk = Color(0xFFF8FAFC)
val DarkMutedText = Color(0xFF94A3B8)

// Semantic Colors
val Success = Color(0xFF10B981)
val SuccessSoft = Color(0xFFECFDF5)
val SuccessDarkSoft = Color(0xFF064E3B).copy(alpha = 0.4f)

val Warning = Color(0xFFF59E0B)
val WarningSoft = Color(0xFFFFFBEB)
val WarningDarkSoft = Color(0xFF78350F).copy(alpha = 0.4f)

val Danger = Color(0xFFEF4444)
val DangerSoft = Color(0xFFFEF2F2)
val DangerDarkSoft = Color(0xFF7F1D1D).copy(alpha = 0.4f)

val Info = Color(0xFF0EA5E9)
val InfoSoft = Color(0xFFF0F9FF)
val InfoDarkSoft = Color(0xFF0C4A6E).copy(alpha = 0.4f)

// Gradients
val PrimaryGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF2563EB), Color(0xFF4F46E5)),
)

val GlowGradient = Brush.radialGradient(
    colors = listOf(Color(0xFF3B82F6).copy(alpha = 0.25f), Color.Transparent),
)

val CardStrokeGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF3B82F6).copy(alpha = 0.3f), Color(0xFF6366F1).copy(alpha = 0.05f)),
)
