"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setStoredAuth, User } from "../../lib/api";
import { useLaundry } from "../../context/LaundryContext";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, fetchAllData, notify } = useLaundry();
  const [loginEmail, setLoginEmail] = useState("pemilik@bilas.demo");
  const [loginPassword, setLoginPassword] = useState("demobilas");
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        data: { token: string; user: User };
      }>("/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      setStoredAuth(res.data.token, res.data.user);
      setCurrentUser(res.data.user);
      await fetchAllData(res.data.user);
      router.replace("/dashboard");
      notify(`Selamat datang, ${res.data.user.name} (${res.data.user.role})`);
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Login gagal, periksa email dan kata sandi"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">SISTEM INFORMASI INTERNAL LAUNDRY</div>
          <h1>Halaman masuk</h1>
        </div>
      </div>

      <div className="login-layout">
        <div className="login-brand">
          <div className="brand">bilas.</div>
          <div>
            <div className="machine"></div>
            <h2>
              Usaha lebih tertata.
              <br />
              Operasional lebih terkendali.
            </h2>
            <p>
              Sistem internal pengelolaan pesanan, kasir, status pengerjaan, dan
              laporan keuangan laundry.
            </p>
          </div>
          <small>© 2026 Bilas Laundry Internal System</small>
        </div>

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="eyebrow">AUTENTIKASI PENGGUNA</div>
          <h2>Masuk ke workspace</h2>
          <p className="sub">
            Gunakan akun Admin (Owner) atau Pegawai (Kasir) untuk mengakses
            sistem.
          </p>

          <label>
            Email
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Kata sandi
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <button
            type="submit"
            className="primary submit-btn"
            disabled={submitting}
          >
            {submitting ? "Memverifikasi..." : "Masuk ke dashboard →"}
          </button>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="small"
              onClick={() => {
                setLoginEmail("pemilik@bilas.demo");
                setLoginPassword("demobilas");
              }}
            >
              Isi Role: Admin (Owner)
            </button>
            <button
              type="button"
              className="small"
              onClick={() => {
                setLoginEmail("nadia@bilas.demo");
                setLoginPassword("demobilas");
              }}
            >
              Isi Role: Pegawai (Kasir)
            </button>
          </div>

          <p className="footnote">
            Terhubung ke autentikasi berbasis token Laravel Sanctum (
            <code>POST /api/login</code>).
          </p>
        </form>
      </div>
    </section>
  );
}
