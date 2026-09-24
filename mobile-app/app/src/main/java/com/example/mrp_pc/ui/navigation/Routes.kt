package com.example.mrp_pc.ui.navigation

object Routes {
    const val LOGIN = "login"
    const val ORDERS = "orders"
    const val ORDER_DETAIL = "orders/{id}"
    const val STOCK = "orders/{id}/stock"
    const val ASSEMBLE = "orders/{id}/assemble"

    fun orderDetail(id: Int) = "orders/$id"
    fun stock(id: Int) = "orders/$id/stock"
    fun assemble(id: Int) = "orders/$id/assemble"
}
