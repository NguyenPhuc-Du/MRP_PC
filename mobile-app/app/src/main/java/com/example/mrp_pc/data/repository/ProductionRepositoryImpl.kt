package com.example.mrp_pc.data.repository

import com.example.mrp_pc.data.remote.ApiService
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.repository.ProductionRepository

class ProductionRepositoryImpl(
    private val apiService: ApiService
) : ProductionRepository {
    override suspend fun getMyOrders(): List<ProductionOrder> {
        return apiService.getMyOrders().data.map {
            dto ->
            ProductionOrder(
                id = dto.id,
                configName = dto.pcConfig.name,
                description = dto.pcConfig.description,
                quantity = dto.quantityRequested,
                status = dto.status,
                createdAt = dto.createdAt,
            )
        }
    }
}
