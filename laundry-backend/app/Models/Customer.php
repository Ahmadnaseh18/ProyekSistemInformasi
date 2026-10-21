<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'notes',
    ];

    /**
     * Mutator otomatis untuk menstandarisasi nomor WhatsApp menjadi format 628...
     */
    protected function phone(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => self::normalizePhone($value ?? ''),
        );
    }

    /**
     * Helper standarisasi nomor telepon/WhatsApp Indonesia ke format 628...
     * Contoh: "0812-3456-7890" atau "+62 812 3456 7890" -> "6281234567890"
     */
    public static function normalizePhone(string $rawPhone): string
    {
        $digits = preg_replace('/[^0-9]/', '', $rawPhone) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0062')) {
            $digits = substr($digits, 2);
        } elseif (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '62' . $digits;
        }

        return $digits;
    }

    /**
     * Relasi ke tabel orders (Satu pelanggan bisa memiliki banyak pesanan).
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
