package com.example.mrp_pc


import android.app.Application
import com.example.mrp_pc.di.NetworkModule

class MrpApp : Application() {
    override fun onCreate() {
        super.onCreate()
        NetworkModule.initialize(this)
    }
}
