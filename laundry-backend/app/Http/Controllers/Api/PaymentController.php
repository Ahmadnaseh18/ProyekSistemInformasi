<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    /**
     * Menampilkan seluruh riwayat pembayaran.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['order.customer']);

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->query('order_id'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('payment_date', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('payment_date', '<=', $request->query('end_date'));
        }

        $payments = $query->latest('payment_date')->latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Mencatat pembayaran untuk pesanan dan memperbarui payment_status pesanan otomatis
     * (belum_lunas / sebagian / lunas).
     */
    public function store(Request $request, ?Order $order = null): JsonResponse
    {
        $rules = [
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', Rule::in(['cash', 'tunai', 'transfer', 'qris', 'ewallet'])],
            'payment_date' => ['nullable', 'date'],
            'payment_status' => ['nullable', Rule::in(OrderController::ALLOWED_PAYMENT_STATUSES)],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];

        if (! $order) {
            $rules['order_id'] = ['required', 'exists:orders,id'];
        }

        $validated = $request->validate($rules);

        $targetOrder = $order ?? Order::findOrFail($validated['order_id']);

        $result = DB::transaction(function () use ($targetOrder, $validated) {
            $existingPaid = (float) $targetOrder->payments()
                ->whereIn('status', ['paid', 'lunas'])
                ->sum('amount');

            $remaining = max(0, (float) $targetOrder->final_price - $existingPaid);
            $amount = isset($validated['amount']) ? (float) $validated['amount'] : $remaining;

            $payment = null;
            if ($amount > 0) {
                $payment = $targetOrder->payments()->create([
                    'amount' => $amount,
                    'payment_method' => $validated['payment_method'] ?? 'cash',
                    'payment_date' => $validated['payment_date'] ?? now(),
                    'status' => 'lunas',
                    'reference_number' => $validated['reference_number'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);
            }

            $newTotalPaid = $existingPaid + $amount;

            if (isset($validated['payment_status'])) {
                $newPaymentStatus = $validated['payment_status'];
            } elseif ($newTotalPaid >= (float) $targetOrder->final_price) {
                $newPaymentStatus = 'lunas';
            } elseif ($newTotalPaid > 0) {
                $newPaymentStatus = 'sebagian';
            } else {
                $newPaymentStatus = 'belum_lunas';
            }

            $targetOrder->update([
                'payment_status' => $newPaymentStatus,
            ]);

            return [
                'payment' => $payment,
                'order' => $targetOrder->fresh(['customer', 'items.service', 'payments']),
                'total_paid' => $newTotalPaid,
                'remaining_balance' => max(0, (float) $targetOrder->final_price - $newTotalPaid),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dicatat.',
            'data' => $result,
        ], 201);
    }

    /**
     * Memperbarui status pembayaran pesanan secara langsung (misal: belum_lunas -> lunas).
     * Jika diubah menjadi lunas dan belum ada record pembayaran yang mencukupi,
     * sistem otomatis membuat record pelunasan di tabel payments.
     */
    public function updatePaymentStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'payment_status' => ['required', Rule::in(OrderController::ALLOWED_PAYMENT_STATUSES)],
            'payment_method' => ['nullable', Rule::in(['cash', 'tunai', 'transfer', 'qris', 'ewallet'])],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $updatedOrder = DB::transaction(function () use ($order, $validated) {
            $newStatus = $validated['payment_status'];

            if (in_array($newStatus, ['lunas', 'paid'], true)) {
                $existingPaid = (float) $order->payments()
                    ->whereIn('status', ['paid', 'lunas'])
                    ->sum('amount');

                $shortfall = (float) $order->final_price - $existingPaid;

                if ($shortfall > 0) {
                    $order->payments()->create([
                        'amount' => $shortfall,
                        'payment_method' => $validated['payment_method'] ?? 'cash',
                        'payment_date' => now(),
                        'status' => 'lunas',
                        'reference_number' => $validated['reference_number'] ?? null,
                        'notes' => $validated['notes'] ?? 'Pelunasan pembayaran pesanan',
                    ]);
                }
            } elseif (in_array($newStatus, ['belum_lunas', 'unpaid'], true)) {
                $order->payments()->delete();
            }

            $order->update([
                'payment_status' => $newStatus,
            ]);

            return $order->fresh(['customer', 'user', 'items.service', 'payments']);
        });

        return response()->json([
            'success' => true,
            'message' => "Status pembayaran berhasil diperbarui menjadi '{$validated['payment_status']}'.",
            'data' => $updatedOrder,
        ]);
    }
}

