package com.example.mrp_pc.domain.usecase

import com.example.mrp_pc.domain.repository.InventoryRepository

class CheckStockUseCase (
    private val repository: InventoryRepository,
) {
    suspend operator fun invoke(orderId: Int) = repository.checkStock(orderId)
}
