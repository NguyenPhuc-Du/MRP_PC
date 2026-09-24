package com.example.mrp_pc.data.repository

import com.example.mrp_pc.data.remote.ApiService
import com.example.mrp_pc.data.remote.dto.StockItemDto
import com.example.mrp_pc.domain.model.ComponentStock
import com.example.mrp_pc.domain.model.StockCheckResult
import com.example.mrp_pc.domain.repository.InventoryRepository

class InventoryRepositoryImpl(
    private val apiService: ApiService
): InventoryRepository {
    override suspend fun checkStock(orderId: Int): StockCheckResult {
        val dto = apiService.getOrderStock(orderId).data
        return StockCheckResult(
            orderId = dto.orderId,
            configName = dto.configName,
            quantityRequested = dto.quantityRequested,
            allEnough = dto.allEnough,
            items = dto.items.map { it.toDomain() },
        )
    }

    private fun StockItemDto.toDomain() = ComponentStock(
        componentId = componentId,
        componentName = componentName,
        unit = unit,
        bomQtyPerUnit = bomQtyPerUnit,
        requiredQty = requiredQty,
        onHandQty = onHandQty,
        missingQty = missingQty,
        isEnough = isEnough,
    )
}
