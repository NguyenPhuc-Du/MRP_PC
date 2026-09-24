package com.example.mrp_pc.data.remote

import com.example.mrp_pc.data.remote.dto.AssembleStatusResponse
import com.example.mrp_pc.data.remote.dto.ConfirmAssembleResponse
import com.example.mrp_pc.data.remote.dto.ExportTicketResponse
import com.example.mrp_pc.data.remote.dto.LoginRequest
import com.example.mrp_pc.data.remote.dto.LoginResponse
import com.example.mrp_pc.data.remote.dto.ProductionOrderDetailResponse
import com.example.mrp_pc.data.remote.dto.ProductionOrderResponse
import com.example.mrp_pc.data.remote.dto.StockCheckResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest,
    ): LoginResponse

    @GET("api/production-orders/me")
    suspend fun getMyOrders(): ProductionOrderResponse

    @GET("api/production-orders/{id}")
    suspend fun getOrderById(@Path("id") id: Int): ProductionOrderDetailResponse

    @GET("api/production-orders/{id}/stock")
    suspend fun getOrderStock(@Path("id") id: Int): StockCheckResponse

    @GET("api/production-orders/{id}/assemble")
    suspend fun getAssembleStatus(@Path("id") id: Int): AssembleStatusResponse

    @POST("api/production-orders/{id}/request-material")
    suspend fun requestMaterialExport(@Path("id") id: Int): ExportTicketResponse

    @POST("api/production-orders/{id}/confirm")
    suspend fun confirmAssemble(@Path("id") id: Int): ConfirmAssembleResponse

    @POST("api/production-orders/{id}/request-product")
    suspend fun requestProductExport(@Path("id") id: Int): ExportTicketResponse
}
