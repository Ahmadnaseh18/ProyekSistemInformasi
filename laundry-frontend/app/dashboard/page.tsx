"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLaundry } from "../../context/LaundryContext";
import OrderTable from "../../components/OrderTable";
import {
  formatDateShort,
  formatMoney,
  formatOrderCode,
  formatTimeShort,
  formatWaNotifiedAt,
  formatYear,
  getOrderAlertInfo,
  getOrderPaidAmount,
  getOrderTotal,
  isAdminRole,
  normalizeStatusLabel,
  toYmd,
} from "../../lib/utils";

type AlertTabKey = "overdue" | "due_soon" | "unclaimed_or_unpaid";

export default function DashboardPage() {
  const {
    currentUser,
    orders,
    payments,
    smartAlerts,
    executiveSummary,
    submitting,
    referenceToday,
    openNewOrderModal,
    openDetailModal,
    openPayModal,
    handleAdvanceStatus,
    handleNotifyWa,
  } = useLaundry();

  const [activeAlertTab, setActiveAlertTab] = useState<AlertTabKey>("overdue");

  const isAdmin = isAdminRole(currentUser?.role);

  // Compute alerts from smartAlerts API or fallback from orders array
  const computedAlerts = useMemo(() => {
    if (smartAlerts) {
      return smartAlerts;
    }
    const overdue = orders.filter(
      (o) => getOrderAlertInfo(o)?.type === "overdue"
    );
    const due_soon = orders.filter(
      (o) => getOrderAlertInfo(o)?.type === "due_soon"
    );
    const unclaimed_or_unpaid = orders.filter(
      (o) => getOrderAlertInfo(o)?.type === "unclaimed_or_unpaid"
    );
    return {
      overdue_count: overdue.length,
      due_soon_count: due_soon.length,
      unclaimed_or_unpaid_count: unclaimed_or_unpaid.length,
      total_alerts_count:
        overdue.length + due_soon.length + unclaimed_or_unpaid.length,
      overdue,
      due_soon,
      unclaimed_or_unpaid,
    };
  }, [smartAlerts, orders]);

  const activeAlertOrders = useMemo(() => {
    if (activeAlertTab === "overdue") return computedAlerts.overdue;
    if (activeAlertTab === "due_soon") return computedAlerts.due_soon;
    return computedAlerts.unclaimed_or_unpaid;
  }, [activeAlertTab, computedAlerts]);

  const todayOrdersCount = useMemo(
    () => orders.filter((o) => toYmd(o.order_date) === referenceToday).length,
    [orders, referenceToday]
  );

  const receivedOrdersCount = useMemo(
    () =>
      orders.filter((o) => normalizeStatusLabel(o.status) === "Diterima")
        .length,
    [orders]
  );

  const processingOrdersCount = useMemo(
    () =>
      orders.filter((o) => normalizeStatusLabel(o.status) === "Diproses")
        .length,
    [orders]
  );

  const readyOrdersCount = useMemo(
    () =>
      orders.filter((o) => normalizeStatusLabel(o.status) === "Selesai").length,
    [orders]
  );

  const takenOrdersCount = useMemo(
    () =>
      orders.filter((o) => normalizeStatusLabel(o.status) === "Diambil").length,
    [orders]
  );

  const todayRevenue = useMemo(
    () =>
      payments
        .filter((p) => toYmd(p.payment_date) === referenceToday)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments, referenceToday]
  );

  const monthPrefix = useMemo(
    () => referenceToday.slice(0, 7),
    [referenceToday]
  );

  const monthRevenue = useMemo(
    () =>
      payments
        .filter((p) => toYmd(p.payment_date).startsWith(monthPrefix))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments, monthPrefix]
  );

  const unpaidSummary = useMemo(() => {
    const unpaidOrders = orders.filter((o) => {
      const total = getOrderTotal(o);
      const paid = getOrderPaidAmount(o);
      return paid < total;
    });
    const totalReceivables = unpaidOrders.reduce((sum, o) => {
      const total = getOrderTotal(o);
      const paid = getOrderPaidAmount(o);
      return sum + Math.max(0, total - paid);
    }, 0);
    return {
      count: unpaidOrders.length,
      totalReceivables,
    };
  }, [orders]);

  const weeklyChartData = useMemo(() => {
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const baseDate = new Date(`${referenceToday}T12:00:00`);
    const days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - (6 - idx));
      const ymd = d.toISOString().slice(0, 10);
      const amount = payments
        .filter((p) => toYmd(p.payment_date) === ymd)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return {
        ymd,
        dayLabel: dayNames[d.getDay()],
        shortDate: formatDateShort(ymd),
        amount,
      };
    });
    const maxAmount = Math.max(...days.map((d) => d.amount), 1);
    return { days, maxAmount };
  }, [payments, referenceToday]);

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">
            {isAdmin
              ? "DASHBOARD KEUANGAN & OPERASIONAL"
              : "DASHBOARD OPERASIONAL HARIAN"}
          </div>
          <h1>
            Selamat bertugas, {currentUser?.name?.split(" ")[0] || "Tim"} 👋
          </h1>
          <p className="sub">
            {isAdmin
              ? `Pantau performa keuangan, pengingat cucian prioritas, dan operasional hari ini.`
              : `Pantau pengingat cucian prioritas, antrean harian, dan transaksi kasir Anda.`}
          </p>
        </div>
        <button className="primary" onClick={openNewOrderModal}>
          ＋ Pesanan baru
        </button>
      </div>

      {/* PANEL PENGINGAT OPERASIONAL PENTING (SMART ALERT) */}
      <div className="smart-alert-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              SMART ALERT · PENGINGAT OPERASIONAL AKTIF
            </div>
            <h2>Pengingat Operasional Penting</h2>
          </div>
          <span className="pill overdue">
            {computedAlerts.total_alerts_count} Perlu Tindakan
          </span>
        </div>

        {/* 3 TAB KATEGORI PENGINGAT */}
        <div className="alert-tabs">
          <button
            type="button"
            className={`alert-tab ${
              activeAlertTab === "overdue" ? "active-overdue" : ""
            }`}
            onClick={() => setActiveAlertTab("overdue")}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                ⚠ Pesanan Terlambat (Overdue)
              </div>
              <small style={{ fontSize: 10, opacity: 0.8 }}>
                Melewati waktu estimasi selesai
              </small>
            </div>
            <span className="pill overdue">
              {computedAlerts.overdue_count}
            </span>
          </button>

          <button
            type="button"
            className={`alert-tab ${
              activeAlertTab === "due_soon" ? "active-duesoon" : ""
            }`}
            onClick={() => setActiveAlertTab("due_soon")}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                ⏳ Segera Jatuh Tempo (&lt; 6 Jam)
              </div>
              <small style={{ fontSize: 10, opacity: 0.8 }}>
                Deadline pengerjaan kurang dari 6 jam
              </small>
            </div>
            <span className="pill due-soon">
              {computedAlerts.due_soon_count}
            </span>
          </button>

          <button
            type="button"
            className={`alert-tab ${
              activeAlertTab === "unclaimed_or_unpaid" ? "active-unclaimed" : ""
            }`}
            onClick={() => setActiveAlertTab("unclaimed_or_unpaid")}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                📦 Belum Diambil & Belum Lunas
              </div>
              <small style={{ fontSize: 10, opacity: 0.8 }}>
                Status selesai menunggu diambil / pelunasan
              </small>
            </div>
            <span className="pill belum">
              {computedAlerts.unclaimed_or_unpaid_count}
            </span>
          </button>
        </div>

        {/* DAFTAR PESANAN PADA TAB PENGINGAT AKTIF BESERTA TOMBOL PINTASAN */}
        <div>
          {activeAlertOrders.length > 0 ? (
            activeAlertOrders.map((o) => {
              const firstItem = o.items?.[0];
              const srvName = firstItem?.service?.name || "Layanan Laundry";
              const qty = firstItem
                ? `${Number(firstItem.quantity)} ${
                    firstItem.service?.unit || "kg"
                  }`
                : "";
              const statusLabel = normalizeStatusLabel(o.status);
              const total = getOrderTotal(o);
              const paid = getOrderPaidAmount(o);
              const isUnpaid = paid < total;
              const dueStr =
                o.estimated_done_at || o.estimated_completion_date;
              const alertInfo = getOrderAlertInfo(o);

              return (
                <div key={o.id} className="alert-row">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span className={alertInfo?.pillClass || "pill"}>
                      {alertInfo?.badgeText || statusLabel}
                    </span>
                    <div>
                      <div style={{ fontSize: 13 }}>
                        <strong style={{ color: "var(--teal)" }}>
                          {formatOrderCode(o)}
                        </strong>{" "}
                        · <b>{o.customer?.name || "Pelanggan"}</b> ({srvName}{" "}
                        {qty})
                        {o.wa_notified_at && (
                          <span
                            className="pill wa-sent"
                            style={{ marginLeft: 8 }}
                            title="Notifikasi WhatsApp sudah dikirim ke pelanggan"
                          >
                            ✓ WA Terkirim ({formatWaNotifiedAt(o.wa_notified_at)})
                          </span>
                        )}
                      </div>
                      <small style={{ color: "var(--muted)", fontSize: 11 }}>
                        Status: <b>{statusLabel}</b> · Estimasi Selesai:{" "}
                        {formatDateShort(dueStr)}{" "}
                        {formatTimeShort(dueStr)
                          ? `pukul ${formatTimeShort(dueStr)}`
                          : ""}{" "}
                        ({alertInfo?.detailText || "-"}) · Tagihan:{" "}
                        <b>{formatMoney(total)}</b> (
                        {isUnpaid
                          ? `Belum Lunas - Sisa ${formatMoney(total - paid)}`
                          : "Lunas"}
                        )
                      </small>
                    </div>
                  </div>

                  {/* TOMBOL PINTASAN LANGSUNG */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {isUnpaid && (
                      <button
                        type="button"
                        className="small"
                        onClick={() => openPayModal(o)}
                      >
                        💳 Catat Bayar
                      </button>
                    )}

                    {statusLabel !== "Diambil" && (
                      <button
                        type="button"
                        className="small primary"
                        disabled={submitting}
                        onClick={() => {
                          if (statusLabel === "Selesai" && isUnpaid) {
                            openPayModal(o);
                          } else {
                            handleAdvanceStatus(o);
                          }
                        }}
                      >
                        {statusLabel === "Diterima"
                          ? "⚡ Mulai Proses"
                          : statusLabel === "Diproses"
                          ? "✓ Tandai Selesai"
                          : isUnpaid
                          ? "💳 Lunasi & Ambil"
                          : "✓ Konfirmasi Diambil"}
                      </button>
                    )}

                    {o.customer?.phone && (
                      <button
                        type="button"
                        className={`small ${
                          statusLabel === "Selesai" ? "wa-btn" : ""
                        }`}
                        disabled={submitting}
                        onClick={() => handleNotifyWa(o)}
                        title="Kirim notifikasi WhatsApp ke pelanggan"
                      >
                        {statusLabel === "Selesai"
                          ? "💬 Kabari Siap Diambil (WA)"
                          : "💬 WA ↗"}
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
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 12,
                background: "#f8faf9",
                borderRadius: 9,
              }}
            >
              ✓ Tidak ada pesanan pada kategori pengingat ini.
            </div>
          )}
        </div>
      </div>

      {/* KARTU RINGKASAN EKSEKUTIF OWNER (ROLE: ADMIN) ATAU OPERASIONAL PEGAWAI */}
      {isAdmin ? (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div className="eyebrow" style={{ margin: 0 }}>
              KARTU RINGKASAN EKSEKUTIF OWNER (KEUANGAN & STATUS PESANAN)
            </div>
            <Link href="/reports">
              <button type="button" className="small ghost">
                Buka Laporan Keuangan Lengkap →
              </button>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 14,
              marginBottom: 14,
            }}
          >
            {/* 1. Pendapatan Masuk Hari Ini */}
            <div className="card stat emphasis">
              <div className="stat-head">
                Total Pendapatan Masuk (Hari Ini)
                <span className="stat-icon">↗</span>
              </div>
              <div className="stat-value">
                {formatMoney(
                  executiveSummary?.revenue_today ?? todayRevenue
                )}
              </div>
              <small>
                Uang diterima hari ini (`payments`) ·{" "}
                {formatDateShort(referenceToday)}
              </small>
            </div>

            {/* 2. Pendapatan Masuk Bulan Ini */}
            <div className="card stat">
              <div className="stat-head">
                Total Pendapatan Masuk (Bulan Ini)
                <span className="stat-icon">◈</span>
              </div>
              <div className="stat-value" style={{ color: "var(--teal)" }}>
                {formatMoney(
                  executiveSummary?.revenue_this_month ?? monthRevenue
                )}
              </div>
              <small>Akumulasi kas masuk dari tabel `payments` bulan ini</small>
            </div>

            {/* 3. Total Piutang / Belum Dibayar */}
            <div
              className="card stat"
              style={{
                borderColor:
                  (executiveSummary?.total_receivables ??
                    unpaidSummary.totalReceivables) > 0
                    ? "#f0b9b5"
                    : "var(--line)",
                background:
                  (executiveSummary?.total_receivables ??
                    unpaidSummary.totalReceivables) > 0
                    ? "#fffbfb"
                    : "#fff",
              }}
            >
              <div className="stat-head">
                Total Piutang / Belum Dibayar
                <span className="stat-icon" style={{ color: "#9e2a25" }}>
                  !
                </span>
              </div>
              <div className="stat-value" style={{ color: "#9e2a25" }}>
                {formatMoney(
                  executiveSummary?.total_receivables ??
                    unpaidSummary.totalReceivables
                )}
              </div>
              <small>
                Dari{" "}
                <b>
                  {executiveSummary?.unpaid_orders_count ?? unpaidSummary.count}{" "}
                  pesanan aktif
                </b>{" "}
                berstatus `belum_lunas`
              </small>
            </div>
          </div>

          {/* 4. Ringkasan Jumlah Pesanan Berdasarkan Status */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <h2 style={{ fontSize: 15, marginBottom: 2 }}>
                  Ringkasan Jumlah Pesanan Berdasarkan Status
                </h2>
                <p className="sub" style={{ fontSize: 12 }}>
                  Pemantauan siklus penuh pesanan dari diterima hingga selesai
                  diambil pelanggan
                </p>
              </div>
              <span className="pill lunas">Total {orders.length} Nota</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#eef3f8",
                  border: "1px solid #d5e1ee",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#2c4c6b",
                    marginBottom: 4,
                  }}
                >
                  ◷ Diterima
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#2c4c6b",
                  }}
                >
                  {executiveSummary?.status_summary?.diterima ??
                    receivedOrdersCount}
                </div>
                <small style={{ fontSize: 11, color: "#4d6a88" }}>
                  Menunggu masuk proses cuci
                </small>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#fbf3df",
                  border: "1px solid #edd9a7",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#7c5a14",
                    marginBottom: 4,
                  }}
                >
                  ≈ Diproses
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#7c5a14",
                  }}
                >
                  {executiveSummary?.status_summary?.diproses ??
                    processingOrdersCount}
                </div>
                <small style={{ fontSize: 11, color: "#8e6d29" }}>
                  Sedang dicuci / disetrika
                </small>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#e5f3ec",
                  border: "1px solid #bddfcf",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1e5b40",
                    marginBottom: 4,
                  }}
                >
                  ✓ Selesai - Menunggu Diambil
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#1e5b40",
                  }}
                >
                  {executiveSummary?.status_summary?.selesai_menunggu_diambil ??
                    readyOrdersCount}
                </div>
                <small style={{ fontSize: 11, color: "#2d7253" }}>
                  Siap diambil di rak outlet
                </small>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#ecefe9",
                  border: "1px solid #d5dbd0",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#434c44",
                    marginBottom: 4,
                  }}
                >
                  📦 Selesai Diambil
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#434c44",
                  }}
                >
                  {executiveSummary?.status_summary?.selesai_diambil ??
                    takenOrdersCount}
                </div>
                <small style={{ fontSize: 11, color: "#5f6960" }}>
                  Telah diserahkan ke pelanggan
                </small>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats">
          <div className="card stat">
            <div className="stat-head">
              Pesanan hari ini<span className="stat-icon">◈</span>
            </div>
            <div className="stat-value">{todayOrdersCount}</div>
            <small>Pesanan masuk · {formatDateShort(referenceToday)}</small>
          </div>

          <div className="card stat">
            <div className="stat-head">
              Sedang diproses<span className="stat-icon">◈</span>
            </div>
            <div className="stat-value">{processingOrdersCount}</div>
            <small>Dalam antrean pengerjaan</small>
          </div>

          <div className="card stat">
            <div className="stat-head">
              Siap diambil<span className="stat-icon">◈</span>
            </div>
            <div className="stat-value">{readyOrdersCount}</div>
            <small>Menunggu pengambilan</small>
          </div>

          <div className="card stat emphasis">
            <div className="stat-head">
              Antrean diterima<span className="stat-icon">◷</span>
            </div>
            <div className="stat-value">{receivedOrdersCount}</div>
            <small>Menunggu mulai dicuci</small>
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="two-cols">
          <div className="card">
            <div className="card-title">
              <div>
                <h2>Pendapatan minggu ini</h2>
                <p className="sub">
                  Pembayaran diterima · {weeklyChartData.days[0]?.shortDate}–
                  {weeklyChartData.days[6]?.shortDate}{" "}
                  {formatYear(referenceToday)}
                </p>
              </div>
              <span className="legend">
                <i className="dot"></i>Rupiah
              </span>
            </div>
            <div>
              <div className="bars">
                {weeklyChartData.days.map((d) => (
                  <div
                    key={d.ymd}
                    className="bar-wrap"
                    title={`${d.shortDate}: ${formatMoney(d.amount)}`}
                  >
                    <div
                      className="bar"
                      style={{
                        height: `${
                          (d.amount / weeklyChartData.maxAmount) * 100
                        }%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="bar-labels">
                {weeklyChartData.days.map((d) => (
                  <span key={d.ymd}>
                    {d.dayLabel}
                    <br />
                    <span
                      style={{
                        fontSize: 9,
                        display: "block",
                        marginTop: 6,
                      }}
                    >
                      {Math.round(d.amount / 1000)} rb
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <h2>Alur pengerjaan</h2>
              <span className="sub">Pesanan aktif</span>
            </div>
            <div>
              {(["Diterima", "Diproses", "Selesai"] as const).map((st, i) => {
                const count = orders.filter(
                  (o) => normalizeStatusLabel(o.status) === st
                ).length;
                const pct = (count / Math.max(orders.length, 1)) * 100;
                const colors = ["#95b4d0", "#e1bf77", "#68ab8a"];
                const icons = ["◷", "≈", "✓"];
                return (
                  <div key={st} style={{ marginBottom: 20 }}>
                    <div className="flow-meta">
                      <span>
                        {icons[i]} &nbsp;
                        {st === "Selesai" ? "Siap diambil" : st}
                      </span>
                      <b>{count} pesanan</b>
                    </div>
                    <div className="flow-track">
                      <div
                        className="flow-fill"
                        style={{
                          width: `${pct}%`,
                          background: colors[i],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hint">
              ✦ Periksa pesanan berstatus selesai sebelum menyerahkan pakaian
              kepada pelanggan.
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">
            <h2>Alur pengerjaan operasional harian</h2>
            <span className="sub">Status cucian aktif di workshop</span>
          </div>
          <div>
            {(["Diterima", "Diproses", "Selesai"] as const).map((st, i) => {
              const count = orders.filter(
                (o) => normalizeStatusLabel(o.status) === st
              ).length;
              const pct = (count / Math.max(orders.length, 1)) * 100;
              const colors = ["#95b4d0", "#e1bf77", "#68ab8a"];
              const icons = ["◷", "≈", "✓"];
              return (
                <div key={st} style={{ marginBottom: 18 }}>
                  <div className="flow-meta">
                    <span>
                      {icons[i]} &nbsp;
                      {st === "Selesai" ? "Siap diambil" : st}
                    </span>
                    <b>{count} pesanan</b>
                  </div>
                  <div className="flow-track">
                    <div
                      className="flow-fill"
                      style={{
                        width: `${pct}%`,
                        background: colors[i],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hint">
            ✦ Pastikan pembayaran telah lunas sebelum mengonfirmasi pengambilan
            cucian oleh pelanggan.
          </div>
        </div>
      )}

      <div className="card table-card">
        <div className="card-title">
          <div>
            <h2>Pesanan terbaru</h2>
            <p className="sub">Aktivitas terkini dari pelanggan Anda.</p>
          </div>
          <Link href="/orders">
            <button className="ghost small" type="button">
              Lihat semua →
            </button>
          </Link>
        </div>
        <div className="table-scroll">
          <OrderTable orders={orders.slice(0, 5)} />
        </div>
        <div className="table-footer">
          <span>Data sinkronisasi database · Cabang Utama</span>
          <span>
            {formatDateShort(referenceToday)} {formatYear(referenceToday)}
          </span>
        </div>
      </div>
    </section>
  );
}
