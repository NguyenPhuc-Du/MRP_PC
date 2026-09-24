package com.example.mrp_pc.domain.usecase

import com.example.mrp_pc.domain.repository.ProductionRepository

class ConfirmAssembleUseCase(
    private val repository: ProductionRepository,
) {
    suspend operator fun invoke(orderId: Int) = repository.confirmAssemble(orderId)
}
