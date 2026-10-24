package com.example.mrp_pc.ui.components

import android.os.SystemClock
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.navigation.NavController

/**
 * Global click debouncer preventing rapid double-clicks (e.g. accidental multi-tap on buttons or list items).
 */
internal object ClickDebouncer {
    private var lastClickTime = 0L

    fun canClick(debounceIntervalMs: Long = 600L): Boolean {
        val now = SystemClock.elapsedRealtime()
        if (now - lastClickTime >= debounceIntervalMs) {
            lastClickTime = now
            return true
        }
        return false
    }
}

/**
 * Remembers a debounced click callback that prevents rapid multiple clicks.
 */
@Composable
fun rememberSingleClick(
    debounceIntervalMs: Long = 600L,
    onClick: () -> Unit,
): () -> Unit {
    var lastClickTime by remember { mutableLongStateOf(0L) }
    return remember(onClick, debounceIntervalMs) {
        {
            val now = SystemClock.elapsedRealtime()
            if (now - lastClickTime >= debounceIntervalMs) {
                lastClickTime = now
                onClick()
            }
        }
    }
}

/**
 * Modifier to prevent rapid repeated clicks on any clickable composable.
 */
fun Modifier.clickableSingle(
    enabled: Boolean = true,
    debounceIntervalMs: Long = 600L,
    interactionSource: MutableInteractionSource? = null,
    indication: androidx.compose.foundation.Indication? = null,
    onClick: () -> Unit,
): Modifier = composed {
    var lastClickTime by remember { mutableLongStateOf(0L) }
    val currentInteractionSource = interactionSource ?: remember { MutableInteractionSource() }

    this.clickable(
        enabled = enabled,
        interactionSource = currentInteractionSource,
        indication = indication,
        onClick = {
            val now = SystemClock.elapsedRealtime()
            if (now - lastClickTime >= debounceIntervalMs) {
                lastClickTime = now
                onClick()
            }
        },
    )
}

/**
 * Interactive bounce animation modifier when touched, giving premium micro-interaction feedback.
 */
fun Modifier.bounceClick(
    scaleDown: Float = 0.96f,
): Modifier = composed {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) scaleDown else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 400f),
        label = "bounceScale",
    )

    this
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
        }
        .pointerInput(Unit) {
            while (true) {
                awaitPointerEventScope {
                    awaitFirstDown(requireUnconsumed = false)
                    isPressed = true
                    val upOrCancel = waitForUpOrCancellation()
                    isPressed = false
                }
            }
        }
}

/**
 * Safe navigation extension preventing duplicate destinations when clicked rapidly.
 */
fun NavController.navigateSingle(route: String) {
    if (ClickDebouncer.canClick(500L)) {
        try {
            navigate(route) {
                launchSingleTop = true
            }
        } catch (_: Exception) {
            // Ignore accidental redundant navigation
        }
    }
}
