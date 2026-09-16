package com.example.mrp_pc.ui.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mrp_pc.ui.theme.BrandBlue
import com.example.mrp_pc.ui.theme.BrandBlueDark
import com.example.mrp_pc.ui.theme.MutedText
import com.example.mrp_pc.ui.theme.PageBg
//Preview
import androidx.compose.ui.tooling.preview.Preview
import com.example.mrp_pc.ui.theme.MrppcTheme

@Composable
fun LoginScreen(
    onSignIn: (username: String, password: String) -> Unit = {_, _ ->},
    isLoading: Boolean = false,
    errorMessage: String?= null
) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
        ) {
            Column (
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(BrandBlue),
                    contentAlignment = Alignment.Center,
                ){
                    Icon(
                        imageVector = Icons.Filled.Memory,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp),
                    )
                }

                Spacer(Modifier.height(16.dp))
                Text("MRP PC Workshop", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("Nhân viên", fontSize = 13.sp, color = MutedText)

                Spacer(Modifier.height(28.dp))
                Text("Đăng nhập",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,)

                Spacer(Modifier.height(20.dp))
                FieldLabel("Tên đăng nhập")
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("staff")},
                    leadingIcon = {
                        Icon(Icons.Filled.Person, contentDescription = null, tint = MutedText)
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = loginFieldColors()
                )

                Spacer(Modifier.height(16.dp))
                FieldLabel("Mật khẩu")
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it},
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text(password) },
                    leadingIcon = {
                        Icon(Icons.Filled.Lock, contentDescription = null, tint = MutedText)
                    },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword}) {
                            Icon(
                                imageVector = if(showPassword) {
                                    Icons.Filled.VisibilityOff
                                } else {
                                    Icons.Filled.Visibility
                                },
                                contentDescription = "Hiện mật khẩu",
                                tint = MutedText
                            )
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = loginFieldColors()
                )

                if (!errorMessage.isNullOrBlank()) {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        errorMessage,
                        modifier = Modifier.fillMaxWidth(),
                        Color(0xFFDC2626),
                        fontSize = 13.sp,
                    )
                }

                Spacer(Modifier.height(24.dp))
                Button(
                    onClick = { onSignIn(username.trim(), password)},
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = username.isNotBlank() && password.isNotBlank() && !isLoading,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandBlue,
                        disabledContainerColor = BrandBlue.copy(alpha = 0.4f),
                    ),
                ){
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = Color.White,
                            strokeWidth = 2.dp,
                        )
                    }
                    else {
                        Text("Đăng nhập", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    }
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

@Composable fun loginFieldColors() = OutlinedTextFieldDefaults.colors(
    unfocusedBorderColor = Color(0xFFE5E7EB),
    focusedContainerColor = Color.White,
    unfocusedContainerColor = Color(0xFFF9FAFB),
    cursorColor = BrandBlueDark,
)

@Preview(showBackground = true, name = "Login - error")
@Composable
private fun LoginScreenErrorPreview() {
    MrppcTheme(dynamicColor = false) {
        LoginScreen(errorMessage = "Error")
    }
}
