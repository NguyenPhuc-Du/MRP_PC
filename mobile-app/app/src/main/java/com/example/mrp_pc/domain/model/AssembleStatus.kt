package com.example.mrp_pc.domain.model

data class ExportTicket(
    val id: Int,
    val code: String,
    val status: String,
)

data class AssembleStatus(
    val orderId: Int,
    val configName: String,
    val description: String?,
    val quantity: Int,
    val status: String,
    val allEnough: Boolean,
    val missingCount: Int,
    val materialExport: ExportTicket?,
    val productExport: ExportTicket?,
    val canRequestMaterial: Boolean,
    val canConfirmAssemble: Boolean,
    val canRequestProduct: Boolean,
)
