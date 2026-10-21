<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Ringkasan statistik untuk halaman Dashboard utama.
     * Menyesuaikan data berdasarkan role (admin: Keuangan & Operasional, pegawai: Operasional Harian).
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user?->role, ['admin', 'owner'], true);

        $today = now()->toDateString();
        $startOfMonth = now()->startOfMonth()->toDateString();

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

        $recentOrders = Order::with(['customer', 'items.service'])
            ->latest('order_date')
            ->limit(5)
            ->get();

        $responseData = [
            'role' => $isAdmin ? 'admin' : 'pegawai',
            'total_orders' => $totalOrders,
            'today_orders' => $todayOrders,
            'total_customers' => $totalCustomers,
            'status_counts' => $statusCounts,
            'recent_orders' => $recentOrders,
        ];

        if ($isAdmin) {
            $totalRevenue = (float) Order::whereIn('payment_status', ['lunas', 'paid'])
                ->whereNotIn('status', ['dibatalkan', 'cancelled'])
                ->sum('final_price');

            $todayRevenue = (float) Order::whereIn('payment_status', ['lunas', 'paid'])
                ->whereNotIn('status', ['dibatalkan', 'cancelled'])
                ->whereDate('order_date', $today)
                ->sum('final_price');

            $monthlyRevenue = (float) Order::whereIn('payment_status', ['lunas', 'paid'])
                ->whereNotIn('status', ['dibatalkan', 'cancelled'])
                ->whereDate('order_date', '>=', $startOfMonth)
                ->sum('final_price');

            $unpaidTotal = (float) Order::whereIn('payment_status', ['belum_lunas', 'unpaid', 'sebagian', 'partial'])
                ->whereNotIn('status', ['dibatalkan', 'cancelled'])
                ->sum('final_price');

            $responseData['revenue'] = [
                'today' => $todayRevenue,
                'this_month' => $monthlyRevenue,
                'total_paid' => $totalRevenue,
                'total_unpaid_orders_value' => $unpaidTotal,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $responseData,
        ]);
    }

    /**
     * Rekap laporan transaksi & keuangan berdasarkan rentang tanggal,
     * filter status pembayaran (semua / lunas / belum_lunas),
     * dan filter metode pembayaran (semua / tunai / qris / transfer).
     */
    public function revenue(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $paymentStatusFilter = strtolower((string) $request->query('payment_status', 'all'));
        $paymentMethodFilter = strtolower((string) $request->query('payment_method', 'all'));

        $methodVariants = match ($paymentMethodFilter) {
            'tunai', 'cash' => ['tunai', 'cash'],
            'qris', 'ewallet' => ['qris', 'ewallet'],
            'transfer' => ['transfer'],
            default => null,
        };

        $ordersQuery = Order::with(['customer', 'items.service', 'payments'])
            ->whereDate('order_date', '>=', $startDate)
            ->whereDate('order_date', '<=', $endDate)
            ->whereNotIn('status', ['dibatalkan', 'cancelled']);

        if (in_array($paymentStatusFilter, ['lunas', 'paid'], true)) {
            $ordersQuery->whereIn('payment_status', ['lunas', 'paid']);
        } elseif (in_array($paymentStatusFilter, ['belum_lunas', 'unpaid'], true)) {
            $ordersQuery->whereIn('payment_status', ['belum_lunas', 'unpaid', 'sebagian', 'partial']);
        }

        if ($methodVariants !== null) {
            $ordersQuery->whereHas('payments', function ($q) use ($methodVariants) {
                $q->whereIn(DB::raw('LOWER(payment_method)'), $methodVariants);
            });
        }

        $allOrders = (clone $ordersQuery)->latest('order_date')->get();

        $paidOrders = $allOrders->whereIn('payment_status', ['lunas', 'paid']);
        $unpaidOrders = $allOrders->whereIn('payment_status', ['belum_lunas', 'unpaid', 'sebagian', 'partial']);

        $grossRevenue = (float) $allOrders->sum('total_price');
        $totalDiscount = (float) $allOrders->sum('discount');
        $netRevenue = (float) $paidOrders->sum('final_price');
        $potentialUnpaid = (float) $unpaidOrders->sum(function (Order $order) {
            $paid = (float) $order->payments
                ->whereIn('status', ['lunas', 'paid'])
                ->sum('amount');

            return max(0, (float) $order->final_price - $paid);
        });

        // Rekap harian berdasarkan pesanan
        $dailyRevenue = Order::select(
                DB::raw('DATE(order_date) as date'),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw("SUM(CASE WHEN payment_status IN ('lunas', 'paid') THEN final_price ELSE 0 END) as paid_revenue"),
                DB::raw("SUM(CASE WHEN payment_status NOT IN ('lunas', 'paid') THEN final_price ELSE 0 END) as unpaid_amount")
            )
            ->whereDate('order_date', '>=', $startDate)
            ->whereDate('order_date', '<=', $endDate)
            ->whereNotIn('status', ['dibatalkan', 'cancelled'])
            ->groupBy(DB::raw('DATE(order_date)'))
            ->orderBy('date')
            ->get();

        // Rekap berdasarkan metode pembayaran dari tabel payments (distandarkan: Tunai, QRIS, Transfer)
        $paymentsQuery = Payment::query()
            ->whereDate('payment_date', '>=', $startDate)
            ->whereDate('payment_date', '<=', $endDate)
            ->whereIn('status', ['lunas', 'paid']);

        if ($methodVariants !== null) {
            $paymentsQuery->whereIn(DB::raw('LOWER(payment_method)'), $methodVariants);
        }

        $rawPayments = $paymentsQuery->get();
        $totalCashReceived = (float) $rawPayments->sum('amount');

        $methodGroups = [
            'Tunai' => ['variants' => ['tunai', 'cash'], 'transactions_count' => 0, 'total_amount' => 0.0],
            'QRIS' => ['variants' => ['qris', 'ewallet'], 'transactions_count' => 0, 'total_amount' => 0.0],
            'Transfer' => ['variants' => ['transfer'], 'transactions_count' => 0, 'total_amount' => 0.0],
        ];

        foreach ($rawPayments as $p) {
            $m = strtolower((string) $p->payment_method);
            if (in_array($m, ['tunai', 'cash'], true)) {
                $key = 'Tunai';
            } elseif (in_array($m, ['qris', 'ewallet'], true)) {
                $key = 'QRIS';
            } else {
                $key = 'Transfer';
            }
            $methodGroups[$key]['transactions_count']++;
            $methodGroups[$key]['total_amount'] += (float) $p->amount;
        }

        $byPaymentMethod = collect($methodGroups)->map(function ($info, $label) {
            return [
                'payment_method' => $label,
                'transactions_count' => $info['transactions_count'],
                'total_amount' => $info['total_amount'],
            ];
        })->values();

        // Rekap layanan paling laris berdasarkan jumlah transaksi di order_items
        $topServices = OrderItem::select(
                'service_id',
                DB::raw('COUNT(*) as transactions_count'),
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as total_revenue')
            )
            ->with('service:id,name,unit,price')
            ->whereHas('order', function ($q) use ($startDate, $endDate, $paymentStatusFilter, $methodVariants) {
                $q->whereDate('order_date', '>=', $startDate)
                  ->whereDate('order_date', '<=', $endDate)
                  ->whereNotIn('status', ['dibatalkan', 'cancelled']);

                if (in_array($paymentStatusFilter, ['lunas', 'paid'], true)) {
                    $q->whereIn('payment_status', ['lunas', 'paid']);
                } elseif (in_array($paymentStatusFilter, ['belum_lunas', 'unpaid'], true)) {
                    $q->whereIn('payment_status', ['belum_lunas', 'unpaid', 'sebagian', 'partial']);
                }

                if ($methodVariants !== null) {
                    $q->whereHas('payments', function ($pq) use ($methodVariants) {
                        $pq->whereIn(DB::raw('LOWER(payment_method)'), $methodVariants);
                    });
                }
            })
            ->groupBy('service_id')
            ->orderByDesc('transactions_count')
            ->orderByDesc('total_revenue')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'payment_status' => $paymentStatusFilter,
                    'payment_method' => $paymentMethodFilter,
                ],
                'summary' => [
                    'total_orders' => $allOrders->count(),
                    'paid_orders_count' => $paidOrders->count(),
                    'unpaid_orders_count' => $unpaidOrders->count(),
                    'gross_revenue' => $grossRevenue,
                    'total_discount' => $totalDiscount,
                    'net_revenue' => $netRevenue,
                    'cash_received' => $totalCashReceived,
                    'unpaid_receivables' => $potentialUnpaid,
                ],
                'daily_breakdown' => $dailyRevenue,
                'payment_methods_breakdown' => $byPaymentMethod,
                'top_services' => $topServices,
                'orders' => $allOrders,
            ],
        ]);
    }
}

