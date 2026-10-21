"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLaundry } from "../../context/LaundryContext";
import OrderTable from "../../components/OrderTable";
import {
  apiRequest,
  RevenueReportResponse,
} from "../../lib/api";
import {
  formatDateShort,
  formatMoney,
  formatOrderCode,
  getOrderPaidAmount,
  getOrderTotal,
  normalizePaymentMethod,
  normalizeStatusLabel,
  toYmd,
} from "../../lib/utils";

type PaymentStatusFilter = "all" | "lunas" | "belum_lunas";
type PaymentMethodFilter = "all" | "Tunai" | "QRIS" | "Transfer";

export default function ReportsPage() {
  const { orders, payments, exportCSV, notify, referenceToday } = useLaundry();

  // Default rentang tanggal: 30 hari terakhir hingga hari ini agar data selalu terlihat
  const defaultDateFrom = useMemo(() => {
    const base = new Date(`${referenceToday}T12:00:00`);
    base.setDate(base.getDate() - 14);
    return base.toISOString().slice(0, 10);
  }, [referenceToday]);

  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(referenceToday);
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("all");

  const [apiReport, setApiReport] = useState<RevenueReportResponse | null>(
    null
  );
  const [loadingReport, setLoadingReport] = useState(false);

  // Sinkronisasi tanggal default saat referenceToday berubah pertama kali
  useEffect(() => {
    setDateFrom(defaultDateFrom);
    setDateTo(referenceToday);
  }, [defaultDateFrom, referenceToday]);

  // Ambil data rekapitulasi dari API Laravel /api/reports/revenue
  useEffect(() => {
    if (dateFrom > dateTo) return;
    let active = true;
    setLoadingReport(true);

    const params = new URLSearchParams({
      start_date: dateFrom,
      end_date: dateTo,
      payment_status: paymentStatusFilter,
      payment_method: paymentMethodFilter.toLowerCase(),
    });

    apiRequest<{ data: RevenueReportResponse }>(
      `/reports/revenue?${params.toString()}`
    )
      .then((res) => {
        if (active && res?.data) {
          setApiReport(res.data);
        }
      })
      .catch(() => {
        // Fallback otomatis ke kalkulasi lokal dari state orders & payments
      })
      .finally(() => {
        if (active) setLoadingReport(false);
      });

    return () => {
      active = false;
    };
  }, [dateFrom, dateTo, paymentStatusFilter, paymentMethodFilter, orders, payments]);

  // Kalkulasi lengkap (termasuk filter rentang tanggal, status pembayaran, dan metode pembayaran)
  const reportData = useMemo(() => {
    if (dateFrom > dateTo) {
      return {
        invalidRange: true,
        filteredOrders: [],
        filteredPayments: [],
        paymentMethodsSummary: [] as {
          method: "Tunai" | "QRIS" | "Transfer";
          count: number;
          amount: number;
        }[],
        topServices: [] as {
          serviceId: number;
          name: string;
          unit: string;
          transactionsCount: number;
          totalQuantity: number;
          totalRevenue: number;
        }[],
        totalOrderValue: 0,
        totalCashReceived: 0,
        totalReceivables: 0,
      };
    }

    // 1. Filter pesanan berdasarkan rentang tanggal, status pembayaran, dan metode pembayaran
    const filteredOrders = orders.filter((o) => {
      const d = toYmd(o.order_date);
      if (d < dateFrom || d > dateTo) return false;

      const total = getOrderTotal(o);
      const paid = getOrderPaidAmount(o);
      const isPaid = paid >= total;

      if (paymentStatusFilter === "lunas" && !isPaid) return false;
      if (paymentStatusFilter === "belum_lunas" && isPaid) return false;

      if (paymentMethodFilter !== "all") {
        const orderPayments = o.payments || [];
        const hasMatchingMethod = orderPayments.some(
          (p) => normalizePaymentMethod(p.payment_method) === paymentMethodFilter
        );
        if (!hasMatchingMethod) return false;
      }

      return true;
    });

    // 2. Filter pembayaran pada rentang tanggal & metode pembayaran
    const filteredPayments = payments.filter((p) => {
      const d = toYmd(p.payment_date);
      if (d < dateFrom || d > dateTo) return false;
      if (
        paymentMethodFilter !== "all" &&
        normalizePaymentMethod(p.payment_method) !== paymentMethodFilter
      ) {
        return false;
      }
      return true;
    });

    // 3. Rekapitulasi Pendapatan per Metode Pembayaran (Tunai, QRIS, Transfer)
    const methodsMap: Record<
      "Tunai" | "QRIS" | "Transfer",
      { count: number; amount: number }
    > = {
      Tunai: { count: 0, amount: 0 },
      QRIS: { count: 0, amount: 0 },
      Transfer: { count: 0, amount: 0 },
    };

    filteredPayments.forEach((p) => {
      const m = normalizePaymentMethod(p.payment_method) as
        | "Tunai"
        | "QRIS"
        | "Transfer";
      const targetKey = methodsMap[m] ? m : "Tunai";
      methodsMap[targetKey].count += 1;
      methodsMap[targetKey].amount += Number(p.amount || 0);
    });

    const paymentMethodsSummary = (
      ["Tunai", "QRIS", "Transfer"] as const
    ).map((method) => ({
      method,
      count: methodsMap[method].count,
      amount: methodsMap[method].amount,
    }));

    // 4. Daftar Layanan Paling Laris (berdasarkan jumlah transaksi di order_items)
    const serviceStatsMap = new Map<
      number,
      {
        serviceId: number;
        name: string;
        unit: string;
        transactionsCount: number;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    filteredOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const sId = item.service_id;
        const name = item.service?.name || `Layanan #${sId}`;
        const unit = item.service?.unit || "kg";
        const qty = Number(item.quantity || 0);
        const subtotal = Number(item.subtotal || 0);

        const existing = serviceStatsMap.get(sId);
        if (existing) {
          existing.transactionsCount += 1;
          existing.totalQuantity += qty;
          existing.totalRevenue += subtotal;
        } else {
          serviceStatsMap.set(sId, {
            serviceId: sId,
            name,
            unit,
            transactionsCount: 1,
            totalQuantity: qty,
            totalRevenue: subtotal,
          });
        }
      });
    });

    let topServices = Array.from(serviceStatsMap.values()).sort((a, b) => {
      if (b.transactionsCount !== a.transactionsCount) {
        return b.transactionsCount - a.transactionsCount;
      }
      return b.totalRevenue - a.totalRevenue;
    });

    // Jika API mengembalikan top_services dan sinkron dengan filter, gunakan hasil agregasi database
    if (apiReport?.top_services && apiReport.top_services.length > 0) {
      topServices = apiReport.top_services.map((row) => ({
        serviceId: row.service_id,
        name: row.service?.name || `Layanan #${row.service_id}`,
        unit: row.service?.unit || "kg",
        transactionsCount: Number(row.transactions_count || 0),
        totalQuantity: Number(row.total_quantity || 0),
        totalRevenue: Number(row.total_revenue || 0),
      }));
    }

    const totalOrderValue = filteredOrders.reduce(
      (sum, o) => sum + getOrderTotal(o),
      0
    );
    const totalCashReceived = filteredPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );
    const totalReceivables = filteredOrders.reduce((sum, o) => {
      const total = getOrderTotal(o);
      const paid = getOrderPaidAmount(o);
      return sum + Math.max(0, total - paid);
    }, 0);

    return {
      invalidRange: false,
      filteredOrders,
      filteredPayments,
      paymentMethodsSummary,
      topServices,
      totalOrderValue,
      totalCashReceived,
      totalReceivables,
    };
  }, [
    orders,
    payments,
    dateFrom,
    dateTo,
    paymentStatusFilter,
    paymentMethodFilter,
    apiReport,
  ]);

  const handleDownloadCSV = () => {
    if (reportData.invalidRange) {
      notify("Perbaiki rentang tanggal terlebih dahulu");
      return;
    }
    exportCSV(reportData.filteredOrders);
  };

  const handlePrintReport = () => {
    if (reportData.invalidRange) {
      notify("Perbaiki rentang tanggal terlebih dahulu");
      return;
    }
    window.print();
  };

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">ANALITIK & REKAPITULASI OWNER</div>
          <h1>Laporan Transaksi & Keuangan</h1>
          <p className="sub">
            Rekapitulasi pendapatan per metode pembayaran, layanan terlaris, dan
            rincian transaksi.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={handlePrintReport}>
            🖨 Cetak Laporan (Print / PDF)
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleDownloadCSV}
          >
            ↓ Export CSV ({reportData.filteredOrders.length})
          </button>
        </div>
      </div>

      {/* FILTER BAR: RENTANG TANGGAL, STATUS PEMBAYARAN, DAN METODE PEMBAYARAN */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          padding: "16px 20px",
          background: "#fcfdfd",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
            gap: 14,
            alignItems: "end",
          }}
        >
          <label>
            Tanggal Mulai
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label>
            Tanggal Akhir
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>

          <label>
            Filter Status Pembayaran
            <select
              value={paymentStatusFilter}
              onChange={(e) =>
                setPaymentStatusFilter(e.target.value as PaymentStatusFilter)
              }
            >
              <option value="all">Semua Status Pembayaran</option>
              <option value="lunas">Lunas</option>
              <option value="belum_lunas">Belum Lunas</option>
            </select>
          </label>

          <label>
            Filter Metode Pembayaran
            <select
              value={paymentMethodFilter}
              onChange={(e) =>
                setPaymentMethodFilter(e.target.value as PaymentMethodFilter)
              }
            >
              <option value="all">Semua Metode (Tunai / QRIS / Transfer)</option>
              <option value="Tunai">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer">Transfer</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--muted)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            Periode aktif: <b>{formatDateShort(dateFrom)}</b> s/d{" "}
            <b>{formatDateShort(dateTo)}</b> · Status:{" "}
            <b>
              {paymentStatusFilter === "all"
                ? "Semua"
                : paymentStatusFilter === "lunas"
                ? "Lunas"
                : "Belum Lunas"}
            </b>{" "}
            · Metode:{" "}
            <b>
              {paymentMethodFilter === "all" ? "Semua" : paymentMethodFilter}
            </b>
            {loadingReport ? " · Menyinkronkan data..." : ""}
          </span>
          {(paymentStatusFilter !== "all" || paymentMethodFilter !== "all") && (
            <button
              type="button"
              className="small ghost"
              onClick={() => {
                setPaymentStatusFilter("all");
                setPaymentMethodFilter("all");
              }}
            >
              ✕ Reset Filter
            </button>
          )}
        </div>
      </div>

      {reportData.invalidRange ? (
        <div className="card table-card">
          <p className="empty">
            Tanggal akhir harus sama dengan atau setelah tanggal mulai.
          </p>
        </div>
      ) : (
        <>
          {/* KARTU RINGKASAN PERIODE */}
          <div className="stats">
            <div className="card stat">
              <div className="stat-head">
                Total Transaksi<span className="stat-icon">◈</span>
              </div>
              <div className="stat-value">
                {reportData.filteredOrders.length}
              </div>
              <small>Nota sesuai filter terpilih</small>
            </div>

            <div className="card stat">
              <div className="stat-head">
                Nilai Total Pesanan<span className="stat-icon">◈</span>
              </div>
              <div className="stat-value">
                {formatMoney(reportData.totalOrderValue)}
              </div>
              <small>Akumulasi nilai tagihan nota</small>
            </div>

            <div className="card stat emphasis">
              <div className="stat-head">
                Pendapatan Kas Masuk<span className="stat-icon">↗</span>
              </div>
              <div className="stat-value">
                {formatMoney(reportData.totalCashReceived)}
              </div>
              <small>
                Dari {reportData.filteredPayments.length} pembayaran diterima
              </small>
            </div>

            <div className="card stat">
              <div className="stat-head">
                Sisa Piutang (Belum Lunas)<span className="stat-icon">!</span>
              </div>
              <div
                className="stat-value"
                style={{
                  color:
                    reportData.totalReceivables > 0 ? "#9e2a25" : "var(--ink)",
                }}
              >
                {formatMoney(reportData.totalReceivables)}
              </div>
              <small>Tagihan yang belum terbayar</small>
            </div>
          </div>

          {/* DUA KOLOM: REKAP METODE PEMBAYARAN & LAYANAN PALING LARIS */}
          <div className="two-cols" style={{ marginBottom: 24 }}>
            {/* 1. Rekapitulasi Pendapatan per Metode Pembayaran */}
            <div className="card">
              <div className="card-title">
                <div>
                  <h2>Rekapitulasi per Metode Pembayaran</h2>
                  <p className="sub">
                    Rincian penerimaan kas berdasarkan kanal pembayaran (`payments`)
                  </p>
                </div>
                <span className="pill lunas">
                  Total {formatMoney(reportData.totalCashReceived)}
                </span>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {reportData.paymentMethodsSummary.map((item) => {
                  const pct =
                    reportData.totalCashReceived > 0
                      ? Math.round(
                          (item.amount / reportData.totalCashReceived) * 100
                        )
                      : 0;
                  const badgeIcons: Record<string, string> = {
                    Tunai: "💵",
                    QRIS: "📱",
                    Transfer: "🏦",
                  };
                  return (
                    <div
                      key={item.method}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                        background:
                          paymentMethodFilter === item.method
                            ? "#eef6f2"
                            : "#fcfdfd",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 14 }}>
                            {badgeIcons[item.method] || "💳"} {item.method}
                          </strong>
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              color: "var(--muted)",
                            }}
                          >
                            ({item.count} transaksi)
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong
                            style={{ fontSize: 15, color: "var(--teal)" }}
                          >
                            {formatMoney(item.amount)}
                          </strong>
                          <small
                            style={{
                              display: "block",
                              fontSize: 10,
                              color: "var(--muted)",
                            }}
                          >
                            {pct}% dari total kas
                          </small>
                        </div>
                      </div>
                      <div className="flow-track">
                        <div
                          className="flow-fill"
                          style={{
                            width: `${pct}%`,
                            background: "var(--teal)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Daftar Layanan Paling Laris (berdasarkan jumlah transaksi di order_items) */}
            <div className="card">
              <div className="card-title">
                <div>
                  <h2>Daftar Layanan Paling Laris</h2>
                  <p className="sub">
                    Diurutkan berdasarkan jumlah transaksi pada `order_items`
                  </p>
                </div>
                <span className="pill diproses">
                  {reportData.topServices.length} Layanan Aktif
                </span>
              </div>

              {reportData.topServices.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {reportData.topServices.map((srv, idx) => (
                    <div
                      key={srv.serviceId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                        background: idx === 0 ? "#fbf7ea" : "#fcfdfd",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background:
                              idx === 0 ? "#e1bf77" : "var(--bg)",
                            color: idx === 0 ? "#5a3f07" : "var(--ink)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {srv.name}
                            {idx === 0 && (
                              <span
                                className="pill diproses"
                                style={{ marginLeft: 8 }}
                              >
                                ★ Terlaris
                              </span>
                            )}
                          </div>
                          <small style={{ color: "var(--muted)", fontSize: 11 }}>
                            Total volume: <b>{srv.totalQuantity}</b> {srv.unit}
                          </small>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: "var(--teal)",
                          }}
                        >
                          {srv.transactionsCount} Transaksi
                        </div>
                        <small style={{ color: "var(--muted)", fontSize: 11 }}>
                          Omzet: <b>{formatMoney(srv.totalRevenue)}</b>
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty" style={{ padding: "24px 0" }}>
                  Belum ada item layanan pada periode/filter ini.
                </p>
              )}
            </div>
          </div>

          {/* TABEL RINCIAN TRANSAKSI YANG BISA DICETAK (PRINT / EXPORT) */}
          <div className="card table-card">
            <div className="card-title">
              <div>
                <h2>Rincian Transaksi Periode ({reportData.filteredOrders.length} Nota)</h2>
                <p className="sub">
                  Periode {formatDateShort(dateFrom)} s/d{" "}
                  {formatDateShort(dateTo)} · Siap dicetak atau diunduh ke CSV
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="small ghost"
                  onClick={handlePrintReport}
                >
                  🖨 Print Tabel
                </button>
                <button
                  type="button"
                  className="small"
                  onClick={handleDownloadCSV}
                >
                  ↓ Export CSV
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <OrderTable orders={reportData.filteredOrders} />
            </div>

            {/* RINGKASAN FOOTER UNTUK CETAK */}
            <div className="table-footer">
              <span>
                Total Nota: <b>{reportData.filteredOrders.length}</b> · Nilai
                Pesanan: <b>{formatMoney(reportData.totalOrderValue)}</b>
              </span>
              <span>
                Kas Diterima: <b>{formatMoney(reportData.totalCashReceived)}</b>{" "}
                · Sisa Piutang:{" "}
                <b style={{ color: "#9e2a25" }}>
                  {formatMoney(reportData.totalReceivables)}
                </b>
              </span>
            </div>
          </div>
        </>
      )}

      <p className="footnote">
        Laporan Keuangan & Transaksi Owner · Data disinkronkan langsung dari
        tabel `orders`, `order_items`, dan `payments`. Gunakan tombol Cetak
        Laporan untuk menyimpan sebagai PDF atau mencetak langsung.
      </p>
    </section>
  );
}
