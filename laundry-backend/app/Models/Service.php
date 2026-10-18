<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'unit',
        'price',
        'estimated_duration',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'estimated_duration' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relasi ke tabel order_items (Satu layanan bisa digunakan di banyak item pesanan).
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}

