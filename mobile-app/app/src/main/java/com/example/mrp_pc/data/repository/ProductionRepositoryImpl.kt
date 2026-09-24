package com.example.mrp_pc.data.repository

import com.example.mrp_pc.data.remote.ApiService
import com.example.mrp_pc.data.remote.dto.AssembleStatusDto
import com.example.mrp_pc.data.remote.dto.ExportTicketDto
import com.example.mrp_pc.data.remote.dto.ProductionOrderDto
import com.example.mrp_pc.domain.model.AssembleStatus
import com.example.mrp_pc.domain.model.ExportTicket
import com.example.mrp_pc.domain.model.ProductionOrder
import com.example.mrp_pc.domain.repository.ProductionRepository

class ProductionRepositoryImpl(
    private val apiService: ApiService,
) : ProductionRepository {

    override suspend fun getMyOrders(): List<ProductionOrder> {
        return apiService.getMyOrders().data.map { it.toDomain() }
    }

    override suspend fun getOrderById(id: Int): ProductionOrder {
        return apiService.getOrderById(id).data.toDomain()
    }

    override suspend fun getAssembleStatus(id: Int): AssembleStatus {
        return apiService.getAssembleStatus(id).data.toDomain()
    }

    override suspend fun requestMaterialExport(id: Int): ExportTicket {
        return apiService.requestMaterialExport(id).data.toDomain()
    }

    override suspend fun confirmAssemble(id: Int) {
        apiService.confirmAssemble(id)
    }

    override suspend fun requestProductExport(id: Int): ExportTicket {
        return apiService.requestProductExport(id).data.toDomain()
    }

    private fun ProductionOrderDto.toDomain() = ProductionOrder(
        id = id,
        configName = pcConfig.name,
        description = pcConfig.description,
        quantity = quantityRequested,
        status = status,
        createdAt = createdAt,
    )

    private fun AssembleStatusDto.toDomain() = AssembleStatus(
        orderId = order.id,
        configName = order.configName,
        description = order.description,
        quantity = order.quantityRequested,
        status = order.status,
        allEnough = allEnough,
        missingCount = missingCount,
        materialExport = materialExport?.toDomain(),
        productExport = productExport?.toDomain(),
        canRequestMaterial = canRequestMaterial,
        canConfirmAssemble = canConfirmAssemble,
        canRequestProduct = canRequestProduct,
    )

    private fun ExportTicketDto.toDomain() = ExportTicket(
        id = id,
        code = code,
        status = status,
    )
}
