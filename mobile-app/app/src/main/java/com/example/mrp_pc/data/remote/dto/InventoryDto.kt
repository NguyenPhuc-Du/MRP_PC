package com.example.mrp_pc.data.remote.dto

data class StockCheckResponse (
    val data: StockCheckDto,
)

data class StockCheckDto (
    val orderId: Int,
    val configName: String,
    val quantityRequested: Int,
    val allEnough: Boolean,
    val items: List<StockItemDto>
)

data class StockItemDto(
    val componentId: Int,
    val componentName: String,
    val unit: String?,
    val bomQtyPerUnit: Int,
    val requiredQty: Int,
    val onHandQty: Int,
    val missingQty: Int,
    val isEnough: Boolean,
)
