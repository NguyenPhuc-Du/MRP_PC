package com.example.mrp_pc.ui.orders

import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
//Preview
import androidx.compose.ui.tooling.preview.Preview
import com.example.mrp_pc.ui.theme.MrppcTheme

@Composable
fun OrderListScreen(
    onLogout: () -> Unit,
    errorMessage: String? = null,
){
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Đăng nhập thành công")
        Text("Danh sách sản xuất")

        Button(
            onClick = onLogout,
            modifier = Modifier.padding(24.dp)
        ){
            Text("Đăng xuất")
        }
    }
}

@Composable
fun SessionLoadingScreen() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        CircularProgressIndicator()
    }
}

@Preview(showBackground = true, name = "OderList - error")
@Composable
private fun OrderListScreenErrorPreview() {
    MrppcTheme(dynamicColor = false) {
        OrderListScreen(errorMessage = "Error")
    }
}

