package com.example.mrp_pc.domain.model

data class ComponentStock(
    val componentId: Int,
    val componentName: String,
    val unit: String?,
    val bomQtyPerUnit: Int,
    val requiredQty: Int,
    val onHandQty: Int,
    val missingQty: Int,
    val isEnough: Boolean,
)

data class StockCheckResult(
    val orderId: Int,
    val configName: String,
    val quantityRequested: Int,
    val allEnough: Boolean,
    val items: List<ComponentStock>,
)