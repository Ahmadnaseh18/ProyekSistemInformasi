"use client";

import React, { useMemo, useState } from "react";
import { useLaundry } from "../../context/LaundryContext";
import OrderTable from "../../components/OrderTable";
import { normalizeStatusLabel } from "../../lib/utils";

export default function OrdersPage() {
  const {
    orders,
    openNewOrderModal,
    autoNotifyWaOnSelesai,
    setAutoNotifyWaOnSelesai,
  } = useLaundry();
  const [searchOrder, setSearchOrder] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredOrders = useMemo(() => {
    const q = searchOrder.trim().toLowerCase();
    return orders.filter((o) => {
      const statusLabel = normalizeStatusLabel(o.status);
      if (filterStatus && statusLabel !== filterStatus) return false;
      if (!q) return true;
      const haystack = `${o.order_number} ${o.id} ${
        o.customer?.name || ""
      } ${o.customer?.phone || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, searchOrder, filterStatus]);

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">OPERASIONAL</div>
          <h1>Kelola pesanan</h1>
          <p className="sub">
            Dari pakaian diterima, pembaruan status, hingga notifikasi WhatsApp
            siap diambil ke pelanggan.
          </p>
        </div>
        <button className="primary" onClick={openNewOrderModal}>
          ＋ Pesanan baru
        </button>
      </div>

      <div className="toolbar">
        <input
          type="text"
          aria-label="Cari pesanan"
          placeholder="⌕  Cari nomor pesanan atau nama pelanggan…"
          value={searchOrder}
          onChange={(e) => setSearchOrder(e.target.value)}
        />
        <select
          aria-label="Filter status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua status</option>
          <option value="Diterima">Diterima</option>
          <option value="Diproses">Diproses</option>
          <option value="Selesai">Selesai</option>
          <option value="Diambil">Diambil</option>
        </select>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "white",
            border: "1px solid #dfe8e4",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            checked={autoNotifyWaOnSelesai}
            onChange={(e) => setAutoNotifyWaOnSelesai(e.target.checked)}
            style={{ width: 16, height: 16, margin: 0, cursor: "pointer" }}
          />
          <span>
            Kirim notifikasi WA otomatis saat status diubah ke Selesai
          </span>
        </label>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <OrderTable orders={filteredOrders} />
        </div>
        <div className="table-footer">
          <span>
            Menampilkan {filteredOrders.length} dari {orders.length} pesanan
          </span>
          <span>
            Tombol hijau &quot;Kabari Siap Diambil (WA)&quot; muncul otomatis
            saat status Selesai
          </span>
        </div>
      </div>
    </section>
  );
}
