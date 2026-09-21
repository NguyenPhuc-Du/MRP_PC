package com.example.mrp_pc.data.remote.dto

data class ProductionOrderResponse(
    val data: List<ProductionOrderDto>
)

data class ProductionOrderDetailResponse(
    val data: ProductionOrderDto
)

data class ProductionOrderDto (
    val id: Int,
    val quantityRequested: Int,
    val status: String,
    val createdAt: String,
    val completedAt: String,
    val pcConfig: PcConfigDto,
)

data class PcConfigDto(
    val id: Int,
    val name: String,
    val description: String?,
)
