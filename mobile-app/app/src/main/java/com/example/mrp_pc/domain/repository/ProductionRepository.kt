package com.example.mrp_pc.domain.repository

import com.example.mrp_pc.domain.model.AssembleStatus
import com.example.mrp_pc.domain.model.ExportTicket
import com.example.mrp_pc.domain.model.ProductionOrder

interface ProductionRepository {
    suspend fun getMyOrders(): List<ProductionOrder>
    suspend fun getOrderById(id: Int): ProductionOrder
    suspend fun getAssembleStatus(id: Int): AssembleStatus
    suspend fun requestMaterialExport(id: Int): ExportTicket
    suspend fun confirmAssemble(id: Int)
    suspend fun requestProductExport(id: Int): ExportTicket
}
