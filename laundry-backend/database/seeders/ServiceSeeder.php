<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Seed contoh layanan laundry bawaan sesuai UI Bilas.
     */
    public function run(): void
    {
        $services = [
            [
                'name' => 'Cuci & setrika',
                'description' => 'Layanan cuci bersih, kering, setrika uap, dan lipat rapi.',
                'unit' => 'kg',
                'price' => 8000.00,
                'estimated_duration' => 48, // 2 hari
                'is_active' => true,
            ],
            [
                'name' => 'Cuci express',
                'description' => 'Layanan kilat prioritas selesai dalam 1 hari.',
                'unit' => 'kg',
                'price' => 14000.00,
                'estimated_duration' => 24, // 1 hari
                'is_active' => true,
            ],
            [
                'name' => 'Setrika saja',
                'description' => 'Layanan setrika uap rapi beserta pewangi pakaian.',
                'unit' => 'kg',
                'price' => 5000.00,
                'estimated_duration' => 24, // 1 hari
                'is_active' => true,
            ],
            [
                'name' => 'Bed cover',
                'description' => 'Layanan pencucian khusus bed cover atau selimut ukuran besar.',
                'unit' => 'pcs',
                'price' => 30000.00,
                'estimated_duration' => 72, // 3 hari
                'is_active' => true,
            ],
            [
                'name' => 'Laundry sepatu',
                'description' => 'Pembersihan mendalam untuk semua jenis sepatu.',
                'unit' => 'pasang',
                'price' => 35000.00,
                'estimated_duration' => 72, // 3 hari
                'is_active' => true,
            ],
            [
                'name' => 'Dry cleaning',
                'description' => 'Pencucian khusus pakaian berbahan sensitif/jas/gaun.',
                'unit' => 'pcs',
                'price' => 25000.00,
                'estimated_duration' => 72, // 3 hari
                'is_active' => true,
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['name' => $service['name']],
                $service
            );
        }
    }
}
