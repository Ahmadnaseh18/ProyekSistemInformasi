<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Menampilkan ringkasan Dashboard beserta Sistem Pengingat Operasional Aktif (Smart Alert)
     * dan Kartu Ringkasan Eksekutif khusus Owner (role: admin).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user?->role, ['admin', 'owner'], true);

        $now = now();
        $sixHoursLater = $now->copy()->addHours(6);
        $today = $now->toDateString();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();

        $activeStatuses = ['diterima', 'diproses', 'pending', 'washing', 'ironing'];

        // 1. Pesanan Terlambat (Overdue)
        $overdueOrders = Order::with(['customer', 'items.service', 'payments'])
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('estimated_completion_date')
            ->where('estimated_completion_date', '<', $now)
            ->orderBy('estimated_completion_date', 'asc')
            ->get();

        // 2. Segera Jatuh Tempo (Deadline < 6 Jam)
        $dueSoonOrders = Order::with(['customer', 'items.service', 'payments'])
            ->whereIn('status', $activeStatuses)
            ->whereNotNull('estimated_completion_date')
            ->where('estimated_completion_date', '>=', $now)
            ->where('estimated_completion_date', '<=', $sixHoursLater)
            ->orderBy('estimated_completion_date', 'asc')
            ->get();

        // 3. Belum Diambil & Belum Lunas (Status pengerjaan sudah 'selesai' namun belum 'diambil' atau belum_lunas)
        $unclaimedOrUnpaidOrders = Order::with(['customer', 'items.service', 'payments'])
            ->whereIn('status', ['selesai', 'ready'])
            ->orderBy('estimated_completion_date', 'asc')
            ->get();

        $totalOrders = Order::count();
        $todayOrders = Order::whereDate('order_date', $today)->count();
        $totalCustomers = Customer::count();

        $statusCounts = [
            'diterima' => Order::whereIn('status', ['diterima', 'pending'])->count(),
            'diproses' => Order::whereIn('status', ['diproses', 'washing', 'ironing'])->count(),
            'selesai' => Order::whereIn('status', ['selesai', 'ready'])->count(),
            'diambil' => Order::whereIn('status', ['diambil', 'completed'])->count(),
            'dibatalkan' => Order::whereIn('status', ['dibatalkan', 'cancelled'])->count(),
        ];

        $recentOrders = Order::with(['customer', 'items.service', 'payments'])
            ->latest('order_date')
            ->limit(5)
            ->get();

        $responseData = [
            'role' => $isAdmin ? 'admin' : 'pegawai',
            'total_orders' => $totalOrders,
            'today_orders' => $todayOrders,
            'total_customers' => $totalCustomers,
            'status_counts' => $statusCounts,
            'smart_alerts' => [
                'overdue_count' => $overdueOrders->count(),
                'due_soon_count' => $dueSoonOrders->count(),
                'unclaimed_or_unpaid_count' => $unclaimedOrUnpaidOrders->count(),
                'total_alerts_count' => $overdueOrders->count() + $dueSoonOrders->count() + $unclaimedOrUnpaidOrders->count(),
                'overdue' => $overdueOrders,
                'due_soon' => $dueSoonOrders,
                'unclaimed_or_unpaid' => $unclaimedOrUnpaidOrders,
            ],
            'recent_orders' => $recentOrders,
        ];

        if ($isAdmin) {
            // 1. Total Pendapatan Masuk (Uang diterima hari ini & bulan ini dari tabel payments)
            $todayPaymentsReceived = (float) Payment::whereIn('status', ['lunas', 'paid'])
                ->whereDate('payment_date', $today)
                ->sum('amount');

            $monthPaymentsReceived = (float) Payment::whereIn('status', ['lunas', 'paid'])
                ->whereDate('payment_date', '>=', $startOfMonth)
                ->whereDate('payment_date', '<=', $endOfMonth)
                ->sum('amount');

            $allTimePaymentsReceived = (float) Payment::whereIn('status', ['lunas', 'paid'])
                ->sum('amount');

            // 2. Total Piutang / Belum Dibayar dari pesanan aktif yang payment_status-nya masih belum_lunas / sebagian
            $unpaidActiveOrders = Order::with('payments')
                ->whereIn('payment_status', ['belum_lunas', 'unpaid', 'sebagian', 'partial'])
                ->whereNotIn('status', ['dibatalkan', 'cancelled'])
                ->get();

            $unpaidReceivablesTotal = (float) $unpaidActiveOrders->sum(function (Order $order) {
                $paid = (float) $order->payments
                    ->whereIn('status', ['lunas', 'paid'])
                    ->sum('amount');

                return max(0, (float) $order->final_price - $paid);
            });

            $responseData['revenue'] = [
                'today' => $todayPaymentsReceived,
                'this_month' => $monthPaymentsReceived,
                'total_paid' => $allTimePaymentsReceived,
                'total_unpaid_orders_value' => $unpaidReceivablesTotal,
                'unpaid_orders_count' => $unpaidActiveOrders->count(),
            ];

            $responseData['executive_summary'] = [
                'revenue_today' => $todayPaymentsReceived,
                'revenue_this_month' => $monthPaymentsReceived,
                'revenue_all_time' => $allTimePaymentsReceived,
                'total_receivables' => $unpaidReceivablesTotal,
                'unpaid_orders_count' => $unpaidActiveOrders->count(),
                'status_summary' => [
                    'diterima' => $statusCounts['diterima'],
                    'diproses' => $statusCounts['diproses'],
                    'selesai_menunggu_diambil' => $statusCounts['selesai'],
                    'selesai_diambil' => $statusCounts['diambil'],
                ],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $responseData,
        ]);
    }
}

