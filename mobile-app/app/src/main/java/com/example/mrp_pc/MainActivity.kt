package com.example.mrp_pc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.mrp_pc.ui.navigation.MrpNavGraph
import com.example.mrp_pc.ui.theme.MrppcTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MrppcTheme {
                MrpNavGraph()
            }
        }
    }
}
