<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Endpoint Autentikasi Internal (Tanpa Halaman Publik Pelanggan)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Internal Routes (Wajib Login Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin,pegawai'])->group(function () {
    // Profil & Logout
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard Ringkasan & Smart Alerts
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/reports/summary', [DashboardController::class, 'index']);

    // Katalog Layanan (Read-Only untuk kebutuhan form Kasir Pegawai & Admin)
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{service}', [ServiceController::class, 'show']);

    // Manajemen Data Pelanggan (Admin & Pegawai)
    Route::apiResource('customers', CustomerController::class);

    // Manajemen Pesanan / Kasir, Update Status Pengerjaan & Notifikasi WhatsApp (Admin & Pegawai)
    Route::post('/orders/{order}/notify-wa', [OrderController::class, 'notifyWa']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/payment-status', [PaymentController::class, 'updatePaymentStatus']);
    Route::post('/orders/{order}/payments', [PaymentController::class, 'store']);
    Route::apiResource('orders', OrderController::class);

    // Pencatatan & Pemantauan Pembayaran (Admin & Pegawai)
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Admin-Only Routes (Khusus Role: admin / Owner)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Manajemen Layanan & Harga (Tambah, Ubah, Hapus)
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{service}', [ServiceController::class, 'update']);
    Route::patch('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    // Manajemen Akun Pegawai
    Route::get('/staff', [AuthController::class, 'staff']);
    Route::post('/staff', [AuthController::class, 'storeStaff']);
    Route::put('/staff/{user}', [AuthController::class, 'updateStaff']);
    Route::patch('/staff/{user}', [AuthController::class, 'updateStaff']);
    Route::delete('/staff/{user}', [AuthController::class, 'destroyStaff']);

    // Laporan Keuangan / Transaksi
    Route::get('/reports/revenue', [ReportController::class, 'revenue']);
});
