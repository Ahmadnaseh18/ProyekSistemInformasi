<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Seed contoh data pelanggan awal dengan nomor WA terstandarisasi (628...) dan catatan khusus.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'Alya Putri',
                'phone' => '0812-0000-1001',
                'email' => 'alya@example.com',
                'address' => 'Jl. Melati No. 10, Jakarta',
                'notes' => 'Parfum Sakura, pakaian putih dipisah',
            ],
            [
                'name' => 'Budi Santoso',
                'phone' => '+62 812-0000-1002',
                'email' => 'budi@example.com',
                'address' => 'Jl. Merdeka No. 12, Jakarta',
                'notes' => 'Parfum Ocean Fresh, kemeja kerja digantung (hanger)',
            ],
            [
                'name' => 'Citra Dewi',
                'phone' => '081200001003',
                'email' => 'citra@example.com',
                'address' => 'Jl. Kenanga No. 5, Bandung',
                'notes' => 'Alergi pewangi menyengat (gunakan parfum bayi/soft)',
            ],
            [
                'name' => 'Dimas Pratama',
                'phone' => '0812-0000-1004',
                'email' => 'dimas@example.com',
                'address' => 'Jl. Anggrek No. 21, Surabaya',
                'notes' => 'Parfum Snappy, lipat rapi',
            ],
            [
                'name' => 'Eka Wulandari',
                'phone' => '081200001005',
                'email' => 'eka@example.com',
                'address' => 'Jl. Dahlia No. 8, Yogyakarta',
                'notes' => 'Setrika suhu rendah untuk bahan satin/kebaya',
            ],
            [
                'name' => 'Fajar Ramadhan',
                'phone' => '081200001006',
                'email' => 'fajar@example.com',
                'address' => 'Jl. Cempaka No. 15, Semarang',
                'notes' => 'Parfum Lavender, pengiriman nota via WhatsApp',
            ],
        ];

        foreach ($customers as $customer) {
            $normalizedPhone = Customer::normalizePhone($customer['phone']);
            Customer::updateOrCreate(
                ['phone' => $normalizedPhone],
                $customer
            );
        }
    }
}
