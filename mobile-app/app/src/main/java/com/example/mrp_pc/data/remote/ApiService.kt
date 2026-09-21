package com.example.mrp_pc.data.remote

import com.example.mrp_pc.data.remote.dto.LoginRequest
import com.example.mrp_pc.data.remote.dto.LoginResponse
import com.example.mrp_pc.data.remote.dto.ProductionOrderDetailResponse
import com.example.mrp_pc.data.remote.dto.ProductionOrderResponse
import retrofit2.http.GET
import retrofit2.http.Body
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
    suspend fun getOrderById(@Path("id") id: Int) : ProductionOrderDetailResponse
}
