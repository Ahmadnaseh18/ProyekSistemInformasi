<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes (Tanpa Login)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::get('/services/public', [ServiceController::class, 'index']);
Route::get('/orders/track/{orderNumber}', [OrderController::class, 'track']);

/*
|--------------------------------------------------------------------------
| Protected API Routes (Membutuhkan Bearer Token Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Autentikasi & Profil User
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/staff', [AuthController::class, 'staff']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // CRUD Layanan Laundry & Pelanggan
    Route::apiResource('services', ServiceController::class);
    Route::apiResource('customers', CustomerController::class);

    // Pesanan (Orders) & Pembaruan Status
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/payment-status', [PaymentController::class, 'updatePaymentStatus']);
    Route::post('/orders/{order}/payments', [PaymentController::class, 'store']);
    Route::apiResource('orders', OrderController::class);

    // Pencatatan & Riwayat Pembayaran
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);

    // Dashboard & Laporan Pendapatan
    Route::get('/dashboard', [ReportController::class, 'summary']);
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/revenue', [ReportController::class, 'revenue']);
});
