package com.example.mrp_pc.data.remote.dto

data class AssembleStatusResponse(
    val data: AssembleStatusDto,
)

data class AssembleStatusDto(
    val order: AssembleOrderDto,
    val allEnough: Boolean,
    val missingCount: Int,
    val materialExport: ExportTicketDto?,
    val productExport: ExportTicketDto?,
    val canRequestMaterial: Boolean,
    val canConfirmAssemble: Boolean,
    val canRequestProduct: Boolean,
)

data class AssembleOrderDto(
    val id: Int,
    val configName: String,
    val description: String?,
    val quantityRequested: Int,
    val status: String,
)

data class ExportTicketDto(
    val id: Int,
    val code: String,
    val status: String,
)

data class ExportTicketResponse(
    val data: ExportTicketDto,
)

data class ConfirmAssembleResponse(
    val data: ConfirmAssembleDto,
)

data class ConfirmAssembleDto(
    val orderId: Int,
    val status: String,
)
