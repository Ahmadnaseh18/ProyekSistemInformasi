<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'wa_notified_at',
        'total_price',
        'discount',
        'final_price',
        'status',
        'payment_status',
        'notes',
    ];

    protected $appends = [
        'estimated_done_at',
        'alert_status',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'datetime',
            'estimated_completion_date' => 'datetime',
            'completed_date' => 'datetime',
            'taken_date' => 'datetime',
            'wa_notified_at' => 'datetime',
            'total_price' => 'decimal:2',
            'discount' => 'decimal:2',
            'final_price' => 'decimal:2',
        ];
    }

    /**
     * Alias atribut estimated_done_at yang mengacu pada kolom estimated_completion_date.
     */
    protected function estimatedDoneAt(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->estimated_completion_date?->toIso8601String(),
            set: fn ($value) => ['estimated_completion_date' => $value],
        );
    }

    /**
     * Menghitung status pengingat (Smart Alert) otomatis untuk setiap pesanan:
     * - 'overdue' : status diterima/diproses dan waktu sekarang > estimated_done_at
     * - 'due_soon': status diterima/diproses dan sisa waktu menuju estimated_done_at <= 6 jam
     * - 'unclaimed_or_unpaid': status selesai tapi belum diambil atau payment_status belum_lunas
     * - null : normal
     */
    protected function alertStatus(): Attribute
    {
        return Attribute::make(
            get: function () {
                $status = strtolower((string) $this->status);
                $paymentStatus = strtolower((string) $this->payment_status);
                $now = now();

                if (in_array($status, ['diterima', 'diproses', 'pending', 'washing', 'ironing'], true)) {
                    if ($this->estimated_completion_date) {
                        if ($now->greaterThan($this->estimated_completion_date)) {
                            return 'overdue';
                        }
                        $diffInMinutes = $now->diffInMinutes($this->estimated_completion_date, false);
                        if ($diffInMinutes >= 0 && $diffInMinutes <= 360) {
                            return 'due_soon';
                        }
                    }
                }

                if (in_array($status, ['selesai', 'ready'], true)) {
                    return 'unclaimed_or_unpaid';
                }

                return null;
            }
        );
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
