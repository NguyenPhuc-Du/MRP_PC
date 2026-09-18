package com.example.mrp_pc.domain.usecase

import com.example.mrp_pc.domain.repository.ProductionRepository

class GetMyOrdersUseCase(
    private val repository: ProductionRepository
) {
    suspend operator fun invoke() = repository.getMyOrders()
}
