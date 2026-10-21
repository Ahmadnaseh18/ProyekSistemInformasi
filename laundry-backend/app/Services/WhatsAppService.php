<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Menyusun teks pesan WhatsApp yang rapi dan sopan saat cucian sudah selesai dan siap diambil.
     */
    public function buildReadyNotificationMessage(Order $order): string
    {
        $order->loadMissing(['customer', 'items.service', 'payments']);

        $customerName = $order->customer?->name ?? 'Pelanggan';
        $orderCode = str_starts_with((string) $order->order_number, '#')
            ? $order->order_number
            : '#' . $order->order_number;

        // Daftar layanan & berat/jumlah
        $serviceLines = [];
        foreach ($order->items as $item) {
            $serviceName = $item->service?->name ?? 'Layanan Laundry';
            $unit = $item->service?->unit ?? 'kg';
            $qty = rtrim(rtrim(number_format((float) $item->quantity, 2, ',', '.'), '0'), ',');
            $subtotalRp = 'Rp ' . number_format((float) $item->subtotal, 0, ',', '.');
            $serviceLines[] = "  - {$serviceName}: {$qty} {$unit} ({$subtotalRp})";
        }
        $servicesListText = count($serviceLines) > 0
            ? implode("\n", $serviceLines)
            : '  - Layanan Laundry';

        // Perhitungan Total & Status Pembayaran
        $totalPrice = (float) ($order->final_price ?? $order->total_price ?? 0);
        $paidAmount = (float) $order->payments
            ->whereIn('status', ['paid', 'lunas'])
            ->sum('amount');

        if (in_array(strtolower((string) $order->payment_status), ['lunas', 'paid'], true) && $paidAmount < $totalPrice) {
            $paidAmount = $totalPrice;
        }

        $remaining = max(0, $totalPrice - $paidAmount);
        $totalFormatted = 'Rp ' . number_format($totalPrice, 0, ',', '.');
        $remainingFormatted = 'Rp ' . number_format($remaining, 0, ',', '.');

        $paymentStatusText = $remaining <= 0
            ? 'LUNAS'
            : "BELUM LUNAS (Sisa Tagihan: {$remainingFormatted})";

        $lines = [
            "Halo Kak *{$customerName}*,",
            "Kami dari *Bilas Laundry* ingin mengabarkan bahwa cucian Anda *SUDAH SELESAI & SIAP DIAMBIL* ✨",
            "",
            "*Rincian Nota Pesanan:*",
            "• Nomor Nota: *{$orderCode}*",
            "• Daftar Layanan:",
            $servicesListText,
            "• Total Biaya: *{$totalFormatted}*",
            "• Status Pembayaran: *{$paymentStatusText}*",
        ];

        if (! empty($order->notes)) {
            $lines[] = "• Catatan: {$order->notes}";
        }

        $lines[] = "";
        $lines[] = "Silakan mengambil cucian Anda di outlet kami dengan menunjukkan pesan/nota ini.";
        $lines[] = "Terima kasih telah mempercayakan cucian Anda kepada *Bilas Laundry*! 🙏";

        return implode("\n", $lines);
    }

    /**
     * Membuat link Direct WhatsApp (https://wa.me/{phone}?text={encoded_message}).
     */
    public function buildWaLink(string $rawPhone, string $message): string
    {
        $normalizedPhone = Customer::normalizePhone($rawPhone);

        return "https://wa.me/{$normalizedPhone}?text=" . rawurlencode($message);
    }

    /**
     * Mengirim pesan otomatis melalui WhatsApp Gateway API (misal Fonnte) jika WA_API_TOKEN tersedia.
     * Jika WA_API_TOKEN kosong, sistem tidak error dan tetap mencatat log dengan aman.
     */
    public function send(string $rawPhone, string $message): array
    {
        $normalizedPhone = Customer::normalizePhone($rawPhone);
        $apiUrl = (string) env('WA_API_URL', 'https://api.fonnte.com/send');
        $apiToken = trim((string) env('WA_API_TOKEN', ''));

        if ($normalizedPhone === '') {
            return [
                'gateway_sent' => false,
                'mode' => 'missing_phone',
                'info' => 'Nomor telepon pelanggan belum tersedia.',
            ];
        }

        if ($apiToken === '') {
            Log::info('[WhatsAppService] WA_API_TOKEN kosong. Menggunakan mode Direct WA Link.', [
                'target' => $normalizedPhone,
            ]);

            return [
                'gateway_sent' => false,
                'mode' => 'direct_link_only',
                'info' => 'WA_API_TOKEN belum diatur di .env. Gunakan link WhatsApp langsung.',
            ];
        }

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'Authorization' => $apiToken,
                ])
                ->post($apiUrl, [
                    'target' => $normalizedPhone,
                    'message' => $message,
                ]);

            $successful = $response->successful();

            Log::info('[WhatsAppService] Pengiriman via WhatsApp Gateway API.', [
                'target' => $normalizedPhone,
                'status' => $response->status(),
                'successful' => $successful,
            ]);

            return [
                'gateway_sent' => $successful,
                'mode' => 'gateway_api',
                'info' => $successful
                    ? 'Pesan otomatis berhasil dikirim melalui WhatsApp Gateway API.'
                    : 'Gateway merespons dengan status ' . $response->status() . ', gunakan Direct WA Link.',
            ];
        } catch (\Throwable $e) {
            Log::warning('[WhatsAppService] Gagal menghubungi WhatsApp Gateway API, fallback ke Direct WA Link.', [
                'target' => $normalizedPhone,
                'error' => $e->getMessage(),
            ]);

            return [
                'gateway_sent' => false,
                'mode' => 'fallback_direct_link',
                'info' => 'Gagal menghubungi Gateway API, dialihkan ke Direct WA Link.',
            ];
        }
    }
}

