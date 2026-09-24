package com.example.mrp_pc.domain.usecase

import com.example.mrp_pc.domain.repository.ProductionRepository

class RequestMaterialExportUseCase(
    private val repository: ProductionRepository,
) {
    suspend operator fun invoke(orderId: Int) = repository.requestMaterialExport(orderId)
}
