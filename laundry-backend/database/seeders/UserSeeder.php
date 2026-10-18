<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed data akun Admin, Kasir/Pegawai, dan Owner bawaan.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin Pemilik',
                'email' => 'pemilik@bilas.demo',
                'phone' => '081200000001',
                'role' => 'owner',
                'password' => Hash::make('demobilas'),
            ],
            [
                'name' => 'Nadia Putri',
                'email' => 'nadia@bilas.demo',
                'phone' => '081200000002',
                'role' => 'kasir',
                'password' => Hash::make('demobilas'),
            ],
            [
                'name' => 'Administrator',
                'email' => 'admin@laundry.com',
                'phone' => '081234567890',
                'role' => 'admin',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Kasir Laundry',
                'email' => 'kasir@laundry.com',
                'phone' => '081234567891',
                'role' => 'kasir',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Owner Laundry',
                'email' => 'owner@laundry.com',
                'phone' => '081234567892',
                'role' => 'owner',
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
