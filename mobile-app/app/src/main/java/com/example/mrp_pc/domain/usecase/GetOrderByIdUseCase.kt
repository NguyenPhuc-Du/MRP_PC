package com.example.mrp_pc.domain.usecase

import com.example.mrp_pc.domain.repository.ProductionRepository

class GetOrderByIdUseCase(
    private val repository: ProductionRepository,
) {
    suspend operator fun invoke(id: Int) = repository.getOrderById(id)
}
