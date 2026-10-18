<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * Menampilkan daftar semua layanan laundry.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $services = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Menyimpan layanan laundry baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit' => ['required', 'string', 'max:20'],
            'price' => ['required', 'numeric', 'min:0'],
            'estimated_duration' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil ditambahkan.',
            'data' => $service,
        ], 201);
    }

    /**
     * Menampilkan detail satu layanan laundry.
     */
    public function show(Service $service): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $service,
        ]);
    }

    /**
     * Memperbarui data layanan laundry.
     */
    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit' => ['sometimes', 'required', 'string', 'max:20'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'estimated_duration' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil diperbarui.',
            'data' => $service->fresh(),
        ]);
    }

    /**
     * Menghapus layanan laundry.
     */
    public function destroy(Service $service): JsonResponse
    {
        if ($service->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak dapat dihapus karena sudah digunakan pada transaksi pesanan. Silakan nonaktifkan layanan ini.',
            ], 422);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dihapus.',
        ]);
    }
}

