"use client";

import React, { useMemo, useState } from "react";
import { useLaundry } from "../../context/LaundryContext";
import {
  buildWhatsAppCustomerUrl,
  formatDateShort,
  formatMoney,
  formatYear,
  getInitials,
  getOrderTotal,
  normalizeWaPhone,
} from "../../lib/utils";

export default function CustomersPage() {
  const {
    customers,
    orders,
    openAddCustomerModal,
    openEditCustomerModal,
    handleDeleteCustomer,
    openCustomerHistoryModal,
  } = useLaundry();
  const [searchCustomer, setSearchCustomer] = useState("");

  const filteredCustomers = useMemo(() => {
    const q = searchCustomer.trim().toLowerCase();
    const normPhone = normalizeWaPhone(q);
    return customers.filter((c) => {
      if (!q) return true;
      const textMatch = `${c.name} ${c.phone} ${c.address || ""} ${
        c.notes || ""
      }`
        .toLowerCase()
        .includes(q);
      const waMatch = normPhone.length >= 3 && c.phone.includes(normPhone);
      return textMatch || waMatch;
    });
  }, [customers, searchCustomer]);

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">MANAJEMEN DATA PELANGGAN</div>
          <h1>Pelanggan</h1>
          <p className="sub">
            Kelola direktori pelanggan, nomor WhatsApp terstandarisasi (628...),
            preferensi parfum/pakaian, dan riwayat transaksi.
          </p>
        </div>
        <button className="primary" onClick={openAddCustomerModal}>
          ＋ Tambah pelanggan
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          aria-label="Cari pelanggan"
          placeholder="⌕  Cari cepat nama, nomor WA (08... / 628...), alamat, atau catatan parfum…"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
        />
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PELANGGAN</th>
                <th>NOMOR WHATSAPP</th>
                <th>CATATAN / PREFERENSI</th>
                <th>TOTAL PESANAN</th>
                <th>TRANSAKSI TERAKHIR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  const custOrders = orders.filter(
                    (o) => o.customer_id === c.id
                  );
                  const ordersCount = c.orders_count ?? custOrders.length;
                  const totalSpent =
                    c.total_spent !== undefined && c.total_spent !== null
                      ? Number(c.total_spent)
                      : custOrders.reduce(
                          (sum, o) => sum + getOrderTotal(o),
                          0
                        );

                  const lastDateStr =
                    c.last_order_date || custOrders[0]?.order_date || null;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="avatar">{getInitials(c.name)}</span>
                          <div>
                            <b>{c.name}</b>
                            <small>{c.address || "Alamat belum diisi"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{c.phone}</strong>
                        <small>
                          <a
                            href={buildWhatsAppCustomerUrl(c.phone, c.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--teal)",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            💬 Chat WhatsApp ↗
                          </a>
                        </small>
                      </td>
                      <td style={{ maxWidth: 260, whiteSpace: "normal" }}>
                        {c.notes ? (
                          <span style={{ color: "var(--ink)" }}>{c.notes}</span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>
                            Tidak ada catatan khusus
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{ordersCount} pesanan</strong>
                        <small>{formatMoney(totalSpent)}</small>
                      </td>
                      <td>
                        {lastDateStr ? (
                          <>
                            <strong>
                              {formatDateShort(lastDateStr)}{" "}
                              {formatYear(lastDateStr)}
                            </strong>
                            <small>Transaksi tercatat</small>
                          </>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>
                            Belum ada transaksi
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="small"
                            onClick={() => openEditCustomerModal(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="small ghost"
                            onClick={() => openCustomerHistoryModal(c.id)}
                          >
                            Riwayat →
                          </button>
                          {ordersCount === 0 && (
                            <button
                              className="small ghost"
                              onClick={() => handleDeleteCustomer(c)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
                    Belum ada pelanggan yang sesuai pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>
            Menampilkan {filteredCustomers.length} dari {customers.length}{" "}
            pelanggan terdaftar
          </span>
          <span>Format nomor otomatis: 628xxxxxxxxxx</span>
        </div>
      </div>
    </section>
  );
}
