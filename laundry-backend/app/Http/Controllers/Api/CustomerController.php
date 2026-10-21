<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Menampilkan daftar pelanggan beserta total pesanan (orders_count),
     * tanggal transaksi terakhir (last_order_date), dan total nilai transaksi (total_spent).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::withCount('orders')
            ->withMax('orders as last_order_date', 'order_date')
            ->withSum('orders as total_spent', 'final_price');

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $normalizedPhoneSearch = Customer::normalizePhone($search);

            $query->where(function ($q) use ($search, $normalizedPhoneSearch) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");

                if ($normalizedPhoneSearch !== '') {
                    $q->orWhere('phone', 'like', "%{$normalizedPhoneSearch}%");
                }
            });
        }

        $customers = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Menyimpan data pelanggan baru (nomor WA otomatis distandarisasi ke 628...).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:25'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['phone'] = Customer::normalizePhone($validated['phone']);

        $customer = Customer::create($validated);
        $customer->loadCount('orders');
        $customer->loadMax('orders as last_order_date', 'order_date');
        $customer->loadSum('orders as total_spent', 'final_price');

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan.',
            'data' => $customer,
        ], 201);
    }

    /**
     * Menampilkan detail pelanggan beserta riwayat pesanannya.
     */
    public function show(Customer $customer): JsonResponse
    {
        $customer->loadCount('orders');
        $customer->loadMax('orders as last_order_date', 'order_date');
        $customer->loadSum('orders as total_spent', 'final_price');
        $customer->load(['orders' => function ($query) {
            $query->with(['items.service', 'payments'])->latest('order_date');
        }]);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * Memperbarui data & catatan pelanggan (nomor WA otomatis distandarisasi ke 628...).
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:25'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        if (isset($validated['phone'])) {
            $validated['phone'] = Customer::normalizePhone($validated['phone']);
        }

        $customer->update($validated);
        $freshCustomer = $customer->fresh();
        $freshCustomer?->loadCount('orders');
        $freshCustomer?->loadMax('orders as last_order_date', 'order_date');
        $freshCustomer?->loadSum('orders as total_spent', 'final_price');

        return response()->json([
            'success' => true,
            'message' => 'Data pelanggan berhasil diperbarui.',
            'data' => $freshCustomer,
        ]);
    }

    /**
     * Menghapus data pelanggan.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pelanggan berhasil dihapus.',
        ]);
    }
}
