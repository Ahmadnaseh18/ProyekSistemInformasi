<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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

    protected $appends = [
        'estimated_hours',
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
     * Alias atribut estimated_hours yang terhubung ke kolom estimated_duration (dalam satuan jam).
     */
    protected function estimatedHours(): Attribute
    {
        return Attribute::make(
            get: fn () => (int) ($this->estimated_duration ?? 24),
            set: fn ($value) => ['estimated_duration' => (int) $value],
        );
    }

    /**
     * Relasi ke tabel order_items (Satu layanan bisa digunakan di banyak item pesanan).
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
