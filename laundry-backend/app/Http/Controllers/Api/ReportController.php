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
     */
    public function summary(): JsonResponse
    {
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

        $recentOrders = Order::with(['customer', 'items.service'])
            ->latest('order_date')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => $totalOrders,
                'today_orders' => $todayOrders,
                'total_customers' => $totalCustomers,
                'status_counts' => $statusCounts,
                'revenue' => [
                    'today' => $todayRevenue,
                    'this_month' => $monthlyRevenue,
                    'total_paid' => $totalRevenue,
                    'total_unpaid_orders_value' => $unpaidTotal,
                ],
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    /**
     * Rekap laporan pendapatan berdasarkan rentang tanggal.
     */
    public function revenue(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        $ordersQuery = Order::with(['customer', 'items.service', 'payments'])
            ->whereDate('order_date', '>=', $startDate)
            ->whereDate('order_date', '<=', $endDate)
            ->whereNotIn('status', ['dibatalkan', 'cancelled']);

        $allOrders = (clone $ordersQuery)->latest('order_date')->get();

        $paidOrders = $allOrders->whereIn('payment_status', ['lunas', 'paid']);
        $unpaidOrders = $allOrders->whereIn('payment_status', ['belum_lunas', 'unpaid', 'sebagian', 'partial']);

        $grossRevenue = (float) $paidOrders->sum('total_price');
        $totalDiscount = (float) $paidOrders->sum('discount');
        $netRevenue = (float) $paidOrders->sum('final_price');
        $potentialUnpaid = (float) $unpaidOrders->sum('final_price');

        // Rekap harian berdasarkan pesanan lunas
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

        // Rekap berdasarkan metode pembayaran dari tabel payments
        $byPaymentMethod = Payment::select(
                'payment_method',
                DB::raw('COUNT(*) as transactions_count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->whereDate('payment_date', '>=', $startDate)
            ->whereDate('payment_date', '<=', $endDate)
            ->whereIn('status', ['lunas', 'paid'])
            ->groupBy('payment_method')
            ->get();

        // Rekap layanan terlaris pada periode tersebut
        $topServices = OrderItem::select(
                'service_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as total_revenue')
            )
            ->with('service:id,name,unit,price')
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->whereDate('order_date', '>=', $startDate)
                  ->whereDate('order_date', '<=', $endDate)
                  ->whereNotIn('status', ['dibatalkan', 'cancelled']);
            })
            ->groupBy('service_id')
            ->orderByDesc('total_revenue')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'summary' => [
                    'total_orders' => $allOrders->count(),
                    'paid_orders_count' => $paidOrders->count(),
                    'unpaid_orders_count' => $unpaidOrders->count(),
                    'gross_revenue' => $grossRevenue,
                    'total_discount' => $totalDiscount,
                    'net_revenue' => $netRevenue,
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

