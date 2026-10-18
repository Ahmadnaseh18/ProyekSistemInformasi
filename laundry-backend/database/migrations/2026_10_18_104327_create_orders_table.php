<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('order_date')->useCurrent();
            $table->dateTime('estimated_completion_date')->nullable();
            $table->dateTime('completed_date')->nullable();
            $table->dateTime('taken_date')->nullable();
            $table->decimal('total_price', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('final_price', 12, 2)->default(0);
            $table->enum('status', [
                'diterima', 'diproses', 'selesai', 'diambil', 'dibatalkan',
                'pending', 'washing', 'ironing', 'ready', 'completed', 'cancelled',
            ])->default('diterima');
            $table->enum('payment_status', [
                'belum_lunas', 'sebagian', 'lunas',
                'unpaid', 'partial', 'paid',
            ])->default('belum_lunas');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
