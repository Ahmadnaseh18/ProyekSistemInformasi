<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed data akun Admin (Owner/Pemilik) dan Pegawai (Kasir/Staf) bawaan.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin Pemilik',
                'email' => 'pemilik@bilas.demo',
                'phone' => '081200000001',
                'role' => 'admin',
                'password' => Hash::make('demobilas'),
            ],
            [
                'name' => 'Nadia Putri',
                'email' => 'nadia@bilas.demo',
                'phone' => '081200000002',
                'role' => 'pegawai',
                'password' => Hash::make('demobilas'),
            ],
            [
                'name' => 'Administrator Owner',
                'email' => 'admin@laundry.com',
                'phone' => '081234567890',
                'role' => 'admin',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Pegawai Kasir',
                'email' => 'pegawai@laundry.com',
                'phone' => '081234567891',
                'role' => 'pegawai',
                'password' => Hash::make('password123'),
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
