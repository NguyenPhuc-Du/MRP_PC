package com.example.mrp_pc.ui.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.ui.components.PrimaryButton
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.BrandBlueDark
import com.example.mrp_pc.ui.theme.BrandBlueSoft
import com.example.mrp_pc.ui.theme.CardWhite
import com.example.mrp_pc.ui.theme.Danger
import com.example.mrp_pc.ui.theme.FieldBorder
import com.example.mrp_pc.ui.theme.Ink
import com.example.mrp_pc.ui.theme.MrppcTheme
import com.example.mrp_pc.ui.theme.MutedText
import com.example.mrp_pc.ui.theme.PageBg

@Composable
fun LoginScreen(
    onSignIn: (username: String, password: String) -> Unit = { _, _ -> },
    isLoading: Boolean = false,
    errorMessage: String? = null,
) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(BrandBlueSoft, PageBg, PageBg),
                ),
            )
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(BrandBlue),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Filled.Memory, null, tint = Color.White, modifier = Modifier.size(34.dp))
                }

                Spacer(Modifier.height(16.dp))
                Text("MRP PC Workshop", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Ink)
                Text("Ứng dụng nhân viên lắp ráp", fontSize = 13.sp, color = MutedText)

                Spacer(Modifier.height(28.dp))
                Text(
                    "Đăng nhập",
                    modifier = Modifier.fillMaxWidth(),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
                Text(
                    "Dùng tài khoản staff được cấp từ quản lý",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    fontSize = 13.sp,
                    color = MutedText,
                )

                Spacer(Modifier.height(20.dp))
                FieldLabel("Tên đăng nhập")
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("staff", color = MutedText) },
                    leadingIcon = { Icon(Icons.Filled.Person, null, tint = BrandBlue) },
                    shape = RoundedCornerShape(14.dp),
                    colors = loginFieldColors(),
                )

                Spacer(Modifier.height(14.dp))
                FieldLabel("Mật khẩu")
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("••••••••", color = MutedText) },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    leadingIcon = { Icon(Icons.Filled.Lock, null, tint = BrandBlue) },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                                contentDescription = "Hiện mật khẩu",
                                tint = MutedText,
                            )
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = loginFieldColors(),
                )

                if (!errorMessage.isNullOrBlank()) {
                    Spacer(Modifier.height(12.dp))
                    Text(
                        errorMessage,
                        modifier = Modifier.fillMaxWidth(),
                        color = Danger,
                        fontSize = 13.sp,
                    )
                }

                Spacer(Modifier.height(24.dp))
                if (isLoading) {
                    CircularProgressIndicator(Modifier.size(26.dp), color = BrandBlue, strokeWidth = 2.dp)
                } else {
                    PrimaryButton(
                        text = "Đăng nhập",
                        onClick = { onSignIn(username.trim(), password) },
                        enabled = username.isNotBlank() && password.isNotBlank(),
                    )
                }
            }
        }
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(
        text,
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 6.dp),
        fontSize = 13.sp,
        fontWeight = FontWeight.Medium,
        color = Color(0xFF374151),
    )
}

@Composable
private fun loginFieldColors() = OutlinedTextFieldDefaults.colors(
    unfocusedBorderColor = FieldBorder,
    focusedBorderColor = BrandBlue,
    focusedContainerColor = Color.White,
    unfocusedContainerColor = PageBg,
    cursorColor = BrandBlueDark,
)

@Preview(showBackground = true, name = "Login")
@Composable
private fun LoginPreview() {
    MrppcTheme {
        LoginScreen()
    }
}

@Preview(showBackground = true, name = "Login - lỗi")
@Composable
private fun LoginErrorPreview() {
    MrppcTheme {
        LoginScreen(errorMessage = "Sai tài khoản hoặc mật khẩu")
    }
}

@Preview(showBackground = true, name = "Login - loading")
@Composable
private fun LoginLoadingPreview() {
    MrppcTheme {
        LoginScreen(isLoading = true)
    }
}
