<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'user_id',
        'order_date',
        'estimated_completion_date',
        'completed_date',
        'taken_date',
        'total_price',
        'discount',
        'final_price',
        'status',
        'payment_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'datetime',
            'estimated_completion_date' => 'datetime',
            'completed_date' => 'datetime',
            'taken_date' => 'datetime',
            'total_price' => 'decimal:2',
            'discount' => 'decimal:2',
            'final_price' => 'decimal:2',
        ];
    }

    /**
     * Relasi ke pelanggan pemilik pesanan.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Relasi ke user/pegawai yang membuat atau menangani pesanan.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke daftar item layanan di dalam pesanan.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Alias relasi items untuk kemudahan pemanggilan.
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Relasi ke histori pembayaran untuk pesanan ini.
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}

