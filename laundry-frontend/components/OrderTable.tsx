"use client";

import React from "react";
import { Order } from "../lib/api";
import {
  formatDateShort,
  formatMoney,
  formatOrderCode,
  formatTimeShort,
  formatWaNotifiedAt,
  formatYear,
  getInitials,
  getOrderAlertInfo,
  getOrderPaidAmount,
  getOrderTotal,
  normalizeStatusLabel,
  statusPillClass,
} from "../lib/utils";
import { useLaundry } from "../context/LaundryContext";

interface OrderTableProps {
  orders: Order[];
}

export default function OrderTable({ orders }: OrderTableProps) {
  const { loading, submitting, openDetailModal, handleNotifyWa } = useLaundry();

  return (
    <table>
      <thead>
        <tr>
          <th>NO. PESANAN</th>
          <th>PELANGGAN</th>
          <th>LAYANAN</th>
          <th>ESTIMASI SELESAI</th>
          <th>TOTAL</th>
          <th>STATUS & NOTIFIKASI WA</th>
          <th>AKSI</th>
        </tr>
      </thead>
      <tbody>
        {orders.length > 0 ? (
          orders.map((o) => {
            const firstItem = o.items?.[0];
            const serviceTitle = firstItem?.service?.name || "Layanan Laundry";
            const unit = firstItem?.service?.unit || "kg";
            const qty = firstItem ? Number(firstItem.quantity) : 1;
            const total = getOrderTotal(o);
            const paid = getOrderPaidAmount(o);
            const statusLabel = normalizeStatusLabel(o.status);
            const dueStr = o.estimated_done_at || o.estimated_completion_date;
            const timeShort = formatTimeShort(dueStr);
            const alertInfo = getOrderAlertInfo(o);

            return (
              <tr key={o.id}>
                <td>
                  <strong style={{ color: "var(--teal)" }}>
                    {formatOrderCode(o)}
                  </strong>
                  <small>
                    {formatDateShort(o.order_date)} {formatYear(o.order_date)}
                  </small>
                </td>
                <td>
                  <div className="customer-cell">
                    <span className="avatar">
                      {getInitials(o.customer?.name)}
                    </span>
                    <div>
                      <strong>{o.customer?.name || "Pelanggan"}</strong>
                      {o.customer?.phone && <small>{o.customer.phone}</small>}
                    </div>
                  </div>
                </td>
                <td>
                  {serviceTitle}
                  <small>
                    {qty} {unit}
                  </small>
                </td>
                <td>
                  <div>
                    <strong>
                      {formatDateShort(dueStr)} {formatYear(dueStr)}
                    </strong>
                    {timeShort ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          marginLeft: 6,
                        }}
                      >
                        ({timeShort})
                      </span>
                    ) : null}
                  </div>
                  {alertInfo &&
                    (alertInfo.type === "overdue" ||
                      alertInfo.type === "due_soon") && (
                      <div style={{ marginTop: 6 }}>
                        <span className={alertInfo.pillClass}>
                          {alertInfo.type === "overdue" ? "⚠ " : "⏳ "}
                          {alertInfo.badgeText} · {alertInfo.detailText}
                        </span>
                      </div>
                    )}
                </td>
                <td>
                  <strong>{formatMoney(total)}</strong>
                  <small>{paid >= total ? "Lunas" : "Belum lunas"}</small>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    <span className={statusPillClass(statusLabel)}>
                      {statusLabel}
                    </span>
                    {o.wa_notified_at && (
                      <span className="pill wa-sent">
                        ✓ WA Terkirim ({formatWaNotifiedAt(o.wa_notified_at)})
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                    {statusLabel === "Selesai" && (
                      <button
                        type="button"
                        className="small wa-btn"
                        disabled={submitting}
                        onClick={() => handleNotifyWa(o)}
                        title="Kirim notifikasi WhatsApp bahwa cucian sudah selesai & siap diambil"
                      >
                        💬 Kabari Siap Diambil (WA)
                      </button>
                    )}
                    <button
                      type="button"
                      className="small ghost"
                      onClick={() => openDetailModal(o.id)}
                    >
                      Detail ↗
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={7} className="empty">
              {loading
                ? "Memuat data pesanan dari server..."
                : "Belum ada pesanan yang sesuai."}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
