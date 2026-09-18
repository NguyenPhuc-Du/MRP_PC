package com.example.mrp_pc.domain.model

data class ProductionOrder (
    val id: Int,
    val configName: String,
    val description: String?,
    val quantity: Int,
    val status: String,
    val createdAt: String,
)
