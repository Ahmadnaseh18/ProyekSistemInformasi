<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Seed data transaksi pesanan dan pembayaran awal agar dashboard dan laporan tidak kosong saat diuji.
     */
    public function run(): void
    {
        $user = User::first();
        $customers = Customer::orderBy('id')->get()->values();
        $services = Service::orderBy('id')->get()->values();

        if ($customers->count() < 6 || $services->count() < 4) {
            return;
        }

        $sampleOrders = [
            [
                'order_number' => 'BL-1043',
                'customer' => $customers[5],
                'service' => $services[0], // Cuci & setrika (8000)
                'qty' => 7,
                'total' => 56000,
                'status' => 'diambil',
                'payment_status' => 'lunas',
                'order_date' => '2026-10-15 09:00:00',
                'due_date' => '2026-10-17 09:00:00',
                'paid_amount' => 56000,
                'paid_date' => '2026-10-17 14:00:00',
                'method' => 'tunai',
            ],
            [
                'order_number' => 'BL-1044',
                'customer' => $customers[4],
                'service' => $services[2], // Setrika saja (5000)
                'qty' => 5,
                'total' => 25000,
                'status' => 'selesai',
                'payment_status' => 'lunas',
                'order_date' => '2026-10-16 10:00:00',
                'due_date' => '2026-10-17 10:00:00',
                'paid_amount' => 25000,
                'paid_date' => '2026-10-16 10:15:00',
                'method' => 'transfer',
            ],
            [
                'order_number' => 'BL-1045',
                'customer' => $customers[3],
                'service' => $services[0], // Cuci & setrika (8000)
                'qty' => 6,
                'total' => 48000,
                'status' => 'diproses',
                'payment_status' => 'belum_lunas',
                'order_date' => '2026-10-17 08:30:00',
                'due_date' => '2026-10-19 08:30:00',
                'paid_amount' => 0,
                'paid_date' => null,
                'method' => null,
            ],
            [
                'order_number' => 'BL-1046',
                'customer' => $customers[2],
                'service' => $services[3], // Bed cover (30000)
                'qty' => 2,
                'total' => 60000,
                'status' => 'selesai',
                'payment_status' => 'sebagian',
                'order_date' => '2026-10-17 11:00:00',
                'due_date' => '2026-10-20 11:00:00',
                'paid_amount' => 20000,
                'paid_date' => '2026-10-17 11:05:00',
                'method' => 'tunai',
            ],
            [
                'order_number' => 'BL-1047',
                'customer' => $customers[1],
                'service' => $services[1], // Cuci express (14000)
                'qty' => 3,
                'total' => 42000,
                'status' => 'diproses',
                'payment_status' => 'lunas',
                'order_date' => '2026-10-18 09:30:00',
                'due_date' => '2026-10-19 09:30:00',
                'paid_amount' => 42000,
                'paid_date' => '2026-10-18 09:35:00',
                'method' => 'qris',
            ],
            [
                'order_number' => 'BL-1048',
                'customer' => $customers[0],
                'service' => $services[0], // Cuci & setrika (8000)
                'qty' => 4.5,
                'total' => 36000,
                'status' => 'diterima',
                'payment_status' => 'belum_lunas',
                'order_date' => '2026-10-18 10:15:00',
                'due_date' => '2026-10-20 10:15:00',
                'paid_amount' => 0,
                'paid_date' => null,
                'method' => null,
            ],
        ];

        foreach ($sampleOrders as $data) {
            $order = Order::updateOrCreate(
                ['order_number' => $data['order_number']],
                [
                    'customer_id' => $data['customer']->id,
                    'user_id' => $user?->id,
                    'order_date' => $data['order_date'],
                    'estimated_completion_date' => $data['due_date'],
                    'completed_date' => in_array($data['status'], ['selesai', 'diambil'], true) ? $data['due_date'] : null,
                    'taken_date' => $data['status'] === 'diambil' ? $data['paid_date'] : null,
                    'total_price' => $data['total'],
                    'discount' => 0,
                    'final_price' => $data['total'],
                    'status' => $data['status'],
                    'payment_status' => $data['payment_status'],
                ]
            );

            $order->items()->delete();
            $order->items()->create([
                'service_id' => $data['service']->id,
                'quantity' => $data['qty'],
                'price' => $data['service']->price,
                'subtotal' => $data['total'],
            ]);

            $order->payments()->delete();
            if ($data['paid_amount'] > 0) {
                $order->payments()->create([
                    'amount' => $data['paid_amount'],
                    'payment_method' => $data['method'],
                    'payment_date' => $data['paid_date'],
                    'status' => 'lunas',
                ]);
            }
        }
    }
}

