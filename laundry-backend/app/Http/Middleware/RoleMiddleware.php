<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Memeriksa apakah user yang login memiliki role yang diizinkan.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Normalisasi alias role lama (owner -> admin, kasir -> pegawai)
        $normalizedUserRole = match ($user->role) {
            'owner' => 'admin',
            'kasir' => 'pegawai',
            default => $user->role,
        };

        if (! in_array($user->role, $roles, true) && ! in_array($normalizedUserRole, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}

