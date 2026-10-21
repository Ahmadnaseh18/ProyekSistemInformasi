<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Service;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public const ALLOWED_STATUSES = [
        'diterima', 'diproses', 'selesai', 'diambil', 'dibatalkan',
        'pending', 'washing', 'ironing', 'ready', 'completed', 'cancelled',
    ];

    public const ALLOWED_PAYMENT_STATUSES = [
        'belum_lunas', 'sebagian', 'lunas',
        'unpaid', 'partial', 'paid',
    ];

    /**
     * Menampilkan daftar pesanan dengan filter pencarian, status, dan tanggal.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'user', 'items.service', 'payments']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->query('payment_status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('order_date', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('order_date', '<=', $request->query('end_date'));
        }

        $orders = $query->latest('order_date')->latest('id')->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Membuat pesanan baru beserta perhitungan otomatis harga item, total, diskon,
     * estimasi selesai, pencatatan pelanggan baru (jika opsi + Pelanggan Baru dipilih),
     * dan pencatatan pembayaran awal jika langsung lunas.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'required_without:new_customer', 'exists:customers,id'],
            'new_customer' => ['nullable', 'required_without:customer_id', 'array'],
            'new_customer.name' => ['required_with:new_customer', 'string', 'max:255'],
            'new_customer.phone' => ['required_with:new_customer', 'string', 'max:25'],
            'new_customer.address' => ['nullable', 'string'],
            'new_customer.notes' => ['nullable', 'string'],
            'order_date' => ['nullable', 'date'],
            'estimated_completion_date' => ['nullable', 'date'],
            'estimated_done_at' => ['nullable', 'date'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(self::ALLOWED_STATUSES)],
            'payment_status' => ['nullable', Rule::in(self::ALLOWED_PAYMENT_STATUSES)],
            'payment_method' => ['nullable', Rule::in(['cash', 'tunai', 'transfer', 'qris', 'ewallet'])],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'exists:services,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.1'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            // Jika kasir menginput pelanggan baru langsung dari form pesanan
            if (! empty($validated['new_customer'])) {
                $newCustData = $validated['new_customer'];
                $customer = \App\Models\Customer::create([
                    'name' => $newCustData['name'],
                    'phone' => \App\Models\Customer::normalizePhone($newCustData['phone']),
                    'address' => $newCustData['address'] ?? null,
                    'notes' => $newCustData['notes'] ?? null,
                ]);
                $customerId = $customer->id;
            } else {
                $customerId = $validated['customer_id'];
            }

            $totalPrice = 0;
            $maxDurationHours = 0;
            $orderItemsPayload = [];

            foreach ($validated['items'] as $itemData) {
                $service = Service::findOrFail($itemData['service_id']);
                $quantity = (float) $itemData['quantity'];
                $price = (float) $service->price;
                $subtotal = round($price * $quantity, 2);

                $totalPrice += $subtotal;

                $serviceHours = (int) ($service->estimated_duration ?? 24);
                if ($serviceHours > $maxDurationHours) {
                    $maxDurationHours = $serviceHours;
                }

                $orderItemsPayload[] = [
                    'service_id' => $service->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $subtotal,
                    'notes' => $itemData['notes'] ?? null,
                ];
            }

            $discount = isset($validated['discount']) ? (float) $validated['discount'] : 0;
            $finalPrice = max(0, round($totalPrice - $discount, 2));

            $orderDate = isset($validated['order_date'])
                ? now()->parse($validated['order_date'])
                : now();

            // Jika tanggal order_date dikirim tanpa jam (YYYY-MM-DD), gunakan jam saat ini agar perhitungan jam presisi
            if (isset($validated['order_date']) && strlen(trim($validated['order_date'])) <= 10) {
                $orderDate->setTimeFrom(now());
            }

            $manualEstimatedDone = $validated['estimated_done_at']
                ?? $validated['estimated_completion_date']
                ?? null;

            if (! empty($manualEstimatedDone)) {
                $estimatedCompletionDate = now()->parse($manualEstimatedDone);
                if (strlen(trim((string) $manualEstimatedDone)) <= 10) {
                    $estimatedCompletionDate->setTimeFrom($orderDate);
                }
            } else {
                // Hitung otomatis berdasarkan nilai estimated_hours terlama dari item layanan
                $hoursToAdd = $maxDurationHours > 0 ? $maxDurationHours : 48;
                $estimatedCompletionDate = $orderDate->copy()->addHours($hoursToAdd);
            }

            $paymentStatus = $validated['payment_status'] ?? 'belum_lunas';
            $paidAmount = isset($validated['paid_amount']) ? (float) $validated['paid_amount'] : 0;

            if (in_array($paymentStatus, ['lunas', 'paid'], true) && $paidAmount <= 0) {
                $paidAmount = $finalPrice;
            } elseif ($paidAmount >= $finalPrice && $finalPrice > 0) {
                $paymentStatus = 'lunas';
            } elseif ($paidAmount > 0 && $paidAmount < $finalPrice) {
                $paymentStatus = 'sebagian';
            }

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'customer_id' => $customerId,
                'user_id' => $request->user()?->id,
                'order_date' => $orderDate,
                'estimated_completion_date' => $estimatedCompletionDate,
                'total_price' => $totalPrice,
                'discount' => $discount,
                'final_price' => $finalPrice,
                'status' => $validated['status'] ?? 'diterima',
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($orderItemsPayload as $itemPayload) {
                $order->items()->create($itemPayload);
            }

            if ($paidAmount > 0) {
                $order->payments()->create([
                    'amount' => min($paidAmount, $finalPrice),
                    'payment_method' => $validated['payment_method'] ?? 'cash',
                    'payment_date' => now(),
                    'status' => 'lunas',
                    'notes' => 'Pembayaran saat pembuatan pesanan',
                ]);
            }

            return $order->load(['customer', 'user', 'items.service', 'payments']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibuat.',
            'data' => $order,
        ], 201);
    }

    /**
     * Menampilkan detail satu pesanan.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load(['customer', 'user', 'items.service', 'payments']);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Memperbarui data pesanan (termasuk status, catatan, atau diskon).
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'required', Rule::in(self::ALLOWED_STATUSES)],
            'payment_status' => ['sometimes', 'required', Rule::in(self::ALLOWED_PAYMENT_STATUSES)],
            'discount' => ['sometimes', 'numeric', 'min:0'],
            'estimated_completion_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        if (isset($validated['discount'])) {
            $validated['final_price'] = max(0, round((float) $order->total_price - (float) $validated['discount'], 2));
        }

        if (isset($validated['status'])) {
            $this->applyStatusTimestamps($order, $validated['status'], $validated);
        }

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil diperbarui.',
            'data' => $order->fresh(['customer', 'user', 'items.service', 'payments']),
        ]);
    }

    /**
     * Endpoint khusus untuk memperbarui status pengerjaan pesanan
     * (diterima -> diproses -> selesai -> diambil).
     */
    public function updateStatus(Request $request, Order $order, WhatsAppService $waService): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::ALLOWED_STATUSES)],
            'notes' => ['nullable', 'string'],
            'auto_notify_wa' => ['nullable', 'boolean'],
        ]);

        $updateData = ['status' => $validated['status']];
        if (array_key_exists('notes', $validated) && $validated['notes'] !== null) {
            $updateData['notes'] = $validated['notes'];
        }

        $this->applyStatusTimestamps($order, $validated['status'], $updateData);

        $order->update($updateData);

        $waNotificationData = null;
        if (! empty($validated['auto_notify_wa']) && in_array(strtolower($validated['status']), ['selesai', 'ready'], true)) {
            $order->load(['customer', 'items.service', 'payments']);
            $phone = (string) ($order->customer?->phone ?? '');
            $message = $waService->buildReadyNotificationMessage($order);
            $gatewayResult = $waService->send($phone, $message);
            $waLink = $waService->buildWaLink($phone, $message);

            $order->update(['wa_notified_at' => now()]);

            $waNotificationData = [
                'wa_link' => $waLink,
                'wa_notified_at' => $order->wa_notified_at?->toIso8601String(),
                'gateway_sent' => $gatewayResult['gateway_sent'],
                'gateway_info' => $gatewayResult['info'],
                'message_text' => $message,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => "Status pesanan berhasil diperbarui menjadi '{$validated['status']}'.",
            'data' => $order->fresh(['customer', 'user', 'items.service', 'payments']),
            'wa_notification' => $waNotificationData,
        ]);
    }

    /**
     * Mengirim notifikasi WhatsApp (Hybrid: Bot API Gateway + Direct WA Link)
     * untuk memberitahukan pelanggan bahwa cucian sudah selesai & siap diambil,
     * serta mencatat waktu pengiriman pada kolom wa_notified_at.
     */
    public function notifyWa(Order $order, WhatsAppService $waService): JsonResponse
    {
        $order->load(['customer', 'user', 'items.service', 'orderItems.service', 'payments']);

        if (! $order->customer || empty($order->customer->phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor WhatsApp pelanggan tidak ditemukan pada pesanan ini.',
            ], 422);
        }

        $message = $waService->buildReadyNotificationMessage($order);
        $gatewayResult = $waService->send($order->customer->phone, $message);
        $waLink = $waService->buildWaLink($order->customer->phone, $message);

        $order->update([
            'wa_notified_at' => now(),
        ]);

        $freshOrder = $order->fresh(['customer', 'user', 'items.service', 'payments']);

        return response()->json([
            'success' => true,
            'message' => $gatewayResult['gateway_sent']
                ? 'Notifikasi WhatsApp berhasil dikirim otomatis via Gateway & status WA diperbarui.'
                : 'Status notifikasi WA tercatat. Membuka WhatsApp pelanggan...',
            'data' => [
                'wa_link' => $waLink,
                'wa_notified_at' => $freshOrder?->wa_notified_at?->toIso8601String(),
                'gateway_sent' => $gatewayResult['gateway_sent'],
                'gateway_mode' => $gatewayResult['mode'],
                'gateway_info' => $gatewayResult['info'],
                'message_text' => $message,
                'order' => $freshOrder,
            ],
        ]);
    }

    /**
     * Menghapus pesanan.
     */
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dihapus.',
        ]);
    }

    /**
     * Melacak status pesanan berdasarkan nomor nota (order_number) untuk pelanggan.
     */
    public function track(string $orderNumber): JsonResponse
    {
        $order = Order::with(['customer', 'items.service', 'payments'])
            ->where('order_number', $orderNumber)
            ->first();

        if (! $order) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor pesanan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Mengisi completed_date dan taken_date otomatis sesuai perubahan status.
     */
    private function applyStatusTimestamps(Order $order, string $newStatus, array &$payload): void
    {
        if (in_array($newStatus, ['selesai', 'ready'], true) && ! $order->completed_date) {
            $payload['completed_date'] = now();
        }

        if (in_array($newStatus, ['diambil', 'completed'], true)) {
            if (! $order->completed_date) {
                $payload['completed_date'] = now();
            }
            if (! $order->taken_date) {
                $payload['taken_date'] = now();
            }
        }
    }

    /**
     * Generate nomor nota/pesanan unik dengan format BL-XXXX.
     */
    private function generateOrderNumber(): string
    {
        $lastOrder = Order::orderByDesc('id')->first();
        $nextNum = 1043 + (($lastOrder?->id ?? 0) + 1);

        if ($lastOrder && preg_match('/(\d+)$/', $lastOrder->order_number, $matches)) {
            $nextNum = max($nextNum, ((int) $matches[1]) + 1);
        }

        while (Order::where('order_number', 'BL-' . $nextNum)->exists()) {
            $nextNum++;
        }

        return 'BL-' . $nextNum;
    }
}

