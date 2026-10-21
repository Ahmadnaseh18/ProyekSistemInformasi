"use client";

import React, { useMemo, useState } from "react";
import { useLaundry } from "../../context/LaundryContext";
import {
  formatMoney,
  formatOrderCode,
  getOrderPaidAmount,
  getOrderTotal,
  statusPillClass,
} from "../../lib/utils";

export default function PaymentsPage() {
  const {
    orders,
    payments,
    openDetailModal,
    openPayModal,
    exportCSV,
  } = useLaundry();
  const [filterPay, setFilterPay] = useState("");

  const filteredPaymentOrders = useMemo(() => {
    return orders.filter((o) => {
      const paid = getOrderPaidAmount(o);
      const total = getOrderTotal(o);
      if (filterPay === "unpaid") return paid < total;
      if (filterPay === "paid") return paid >= total;
      return true;
    });
  }, [orders, filterPay]);

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">KEUANGAN</div>
          <h1>Pembayaran</h1>
          <p className="sub">Pantau tagihan dan catat pembayaran pelanggan.</p>
        </div>
        <button onClick={() => exportCSV()}>↓ Ekspor transaksi</button>
      </div>

      <div className="stats">
        <div className="card stat">
          <div className="stat-head">
            Total tagihan<span className="stat-icon">◈</span>
          </div>
          <div className="stat-value">
            {formatMoney(orders.reduce((s, o) => s + getOrderTotal(o), 0))}
          </div>
          <small>Seluruh pesanan</small>
        </div>

        <div className="card stat emphasis">
          <div className="stat-head">
            Pembayaran diterima<span className="stat-icon">↗</span>
          </div>
          <div className="stat-value">
            {formatMoney(
              payments.reduce((s, p) => s + Number(p.amount || 0), 0)
            )}
          </div>
          <small>Seluruh tanggal pembayaran</small>
        </div>

        <div className="card stat">
          <div className="stat-head">
            Sisa tagihan<span className="stat-icon">◈</span>
          </div>
          <div className="stat-value">
            {formatMoney(
              orders.reduce(
                (s, o) =>
                  s + Math.max(0, getOrderTotal(o) - getOrderPaidAmount(o)),
                0
              )
            )}
          </div>
          <small>Menunggu pelunasan</small>
        </div>

        <div className="card stat">
          <div className="stat-head">
            Belum lunas<span className="stat-icon">◈</span>
          </div>
          <div className="stat-value">
            {
              orders.filter((o) => getOrderPaidAmount(o) < getOrderTotal(o))
                .length
            }
          </div>
          <small>Pesanan perlu ditindaklanjuti</small>
        </div>
      </div>

      <div className="card table-card">
        <div className="card-title">
          <h2>Tagihan pesanan</h2>
          <select
            aria-label="Filter pembayaran"
            value={filterPay}
            onChange={(e) => setFilterPay(e.target.value)}
          >
            <option value="">Semua pembayaran</option>
            <option value="unpaid">Belum lunas</option>
            <option value="paid">Lunas</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PESANAN / PELANGGAN</th>
                <th>TOTAL</th>
                <th>DIBAYAR</th>
                <th>SISA TAGIHAN</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPaymentOrders.map((o) => {
                const total = getOrderTotal(o);
                const paid = getOrderPaidAmount(o);
                const remaining = Math.max(0, total - paid);
                const isPaid = paid >= total;
                return (
                  <tr key={o.id}>
                    <td>
                      <b>{formatOrderCode(o)}</b>
                      <small>{o.customer?.name || "Pelanggan"}</small>
                    </td>
                    <td>{formatMoney(total)}</td>
                    <td>{formatMoney(paid)}</td>
                    <td>
                      <b>{formatMoney(remaining)}</b>
                    </td>
                    <td>
                      <span
                        className={statusPillClass(
                          isPaid ? "Lunas" : "Belum lunas"
                        )}
                      >
                        {isPaid ? "Lunas" : "Belum lunas"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="small ghost"
                        onClick={() =>
                          isPaid ? openDetailModal(o.id) : openPayModal(o)
                        }
                      >
                        {isPaid ? "Lihat detail" : "Catat bayar →"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

