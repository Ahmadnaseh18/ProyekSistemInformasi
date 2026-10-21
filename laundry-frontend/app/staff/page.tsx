"use client";

import React, { useState } from "react";
import { apiRequest, User } from "../../lib/api";
import { useLaundry } from "../../context/LaundryContext";
import { getInitials, isAdminRole } from "../../lib/utils";

export default function StaffPage() {
  const { staffList, currentUser, fetchAllData, notify } = useLaundry();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "pegawai">("pegawai");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("pegawai");
    setPassword("");
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || "");
    setRole(isAdminRole(u.role) ? "admin" : "pegawai");
    setPassword("");
    setShowModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await apiRequest(`/staff/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role,
            ...(password.trim() ? { password: password.trim() } : {}),
          }),
        });
        notify("Akun pengguna berhasil diperbarui");
      } else {
        await apiRequest("/staff", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role,
            password: password.trim(),
          }),
        });
        notify("Akun pegawai baru berhasil ditambahkan");
      }
      await fetchAllData();
      setShowModal(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal menyimpan akun pegawai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (u: User) => {
    if (u.id === currentUser?.id) {
      notify("Tidak dapat menghapus akun yang sedang digunakan");
      return;
    }
    try {
      await apiRequest(`/staff/${u.id}`, { method: "DELETE" });
      await fetchAllData();
      notify(`Akun ${u.name} berhasil dihapus`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal menghapus akun");
    }
  };

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">MANAJEMEN AKUN PEGAWAI</div>
          <h1>Tim laundry</h1>
          <p className="sub">
            Kelola akun dan pembagian hak akses Admin (Owner) serta Pegawai
            (Kasir).
          </p>
        </div>
        <button className="primary" onClick={openAddModal}>
          ＋ Tambah pegawai
        </button>
      </div>

      <div className="two-cols">
        {staffList.map((u) => {
          const isAdmin = isAdminRole(u.role);
          return (
            <div key={u.id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div className="avatar">{getInitials(u.name)}</div>
                <span className={`pill ${isAdmin ? "lunas" : ""}`}>
                  {isAdmin ? "role: admin (Owner)" : "role: pegawai (Kasir)"}
                </span>
              </div>
              <h2 style={{ marginTop: 18 }}>{u.name}</h2>
              <p className="sub" style={{ marginTop: 6 }}>
                {u.email} {u.phone ? `· ${u.phone}` : ""}
              </p>
              <div className="divider"></div>
              <p className="sub">
                {isAdmin
                  ? "Akses penuh: Dashboard Keuangan & Operasional, Pesanan, Pelanggan, Layanan & Harga, Pegawai, dan Laporan Keuangan."
                  : "Akses operasional: Dashboard Operasional Harian, Input & Kelola Pesanan, Update Status & Pembayaran, serta Data Pelanggan."}
              </p>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="small"
                  onClick={() => openEditModal(u)}
                >
                  Ubah akun
                </button>
                {u.id !== currentUser?.id && (
                  <button
                    type="button"
                    className="small ghost"
                    onClick={() => handleDeleteStaff(u)}
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hint">
        Setiap akun menggunakan autentikasi token Laravel Sanctum dan diproteksi
        dengan middleware <code>role:admin</code> atau{" "}
        <code>role:admin,pegawai</code> di sisi backend Laravel.
      </div>

      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-box" role="dialog" aria-modal="true">
            <div className="dialog-head">
              <h2>{editingUser ? "Ubah akun pengguna" : "Tambah akun pegawai"}</h2>
              <button
                className="ghost"
                aria-label="Tutup dialog"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className="form-grid">
                <label className="wide">
                  Nama lengkap
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Email login
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Nomor telepon
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </label>
                <label>
                  Peran (Role)
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "admin" | "pegawai")
                    }
                  >
                    <option value="pegawai">pegawai (Kasir / Staf)</option>
                    <option value="admin">admin (Owner / Pemilik)</option>
                  </select>
                </label>
                <label>
                  {editingUser
                    ? "Kata sandi baru (opsional)"
                    : "Kata sandi"}
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingUser}
                    minLength={6}
                    placeholder={
                      editingUser ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"
                    }
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Simpan akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
