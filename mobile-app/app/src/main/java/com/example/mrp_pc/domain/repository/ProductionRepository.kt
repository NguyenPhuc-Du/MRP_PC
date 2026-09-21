package com.example.mrp_pc.domain.repository

import com.example.mrp_pc.domain.model.ProductionOrder

interface ProductionRepository {
    suspend fun getMyOrders(): List<ProductionOrder>

    suspend fun getOrderById(id: Int): ProductionOrder
}
