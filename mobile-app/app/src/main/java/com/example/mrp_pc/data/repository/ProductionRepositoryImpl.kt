package com.example.mrp_pc.data.repository

import com.example.mrp_pc.data.remote.ApiService
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.repository.ProductionRepository
import com.example.mrp_pc.data.remote.dto.ProductionOrderDto

class ProductionRepositoryImpl(
    private val apiService: ApiService,
) : ProductionRepository {

    override suspend fun getMyOrders(): List<ProductionOrder> {
        return apiService.getMyOrders().data.map { it.toDomain() }
    }

    override suspend fun getOrderById(id: Int): ProductionOrder {
        return apiService.getOrderById(id).data.toDomain()
    }

    private fun ProductionOrderDto.toDomain() = ProductionOrder(
        id = id,
        configName = pcConfig.name,
        description = pcConfig.description,
        quantity = quantityRequested,
        status = status,
        createdAt = createdAt,
    )
}
