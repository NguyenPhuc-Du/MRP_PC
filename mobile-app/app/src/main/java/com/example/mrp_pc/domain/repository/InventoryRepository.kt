package com.example.mrp_pc.domain.repository

import com.example.mrp_pc.domain.model.StockCheckResult

interface InventoryRepository {
    suspend fun checkStock(orderId: Int): StockCheckResult
}