<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Seed contoh data pelanggan awal sesuai UI Bilas.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'Alya Putri',
                'phone' => '081200001001',
                'email' => 'alya@example.com',
                'address' => 'Jl. Melati No. 10, Jakarta',
            ],
            [
                'name' => 'Budi Santoso',
                'phone' => '081200001002',
                'email' => 'budi@example.com',
                'address' => 'Jl. Merdeka No. 12, Jakarta',
            ],
            [
                'name' => 'Citra Dewi',
                'phone' => '081200001003',
                'email' => 'citra@example.com',
                'address' => 'Jl. Kenanga No. 5, Bandung',
            ],
            [
                'name' => 'Dimas Pratama',
                'phone' => '081200001004',
                'email' => 'dimas@example.com',
                'address' => 'Jl. Anggrek No. 21, Surabaya',
            ],
            [
                'name' => 'Eka Wulandari',
                'phone' => '081200001005',
                'email' => 'eka@example.com',
                'address' => 'Jl. Dahlia No. 8, Yogyakarta',
            ],
            [
                'name' => 'Fajar Ramadhan',
                'phone' => '081200001006',
                'email' => 'fajar@example.com',
                'address' => 'Jl. Cempaka No. 15, Semarang',
            ],
        ];

        foreach ($customers as $customer) {
            Customer::updateOrCreate(
                ['phone' => $customer['phone']],
                $customer
            );
        }
    }
}
