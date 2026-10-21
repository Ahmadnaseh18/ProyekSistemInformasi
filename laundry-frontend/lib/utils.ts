import { AlertStatusType, Order } from "./api";

export const STATUS_STEPS = ["Diterima", "Diproses", "Selesai", "Diambil"] as const;

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "owner";
}

export function isPegawaiRole(role?: string | null): boolean {
  return role === "pegawai" || role === "kasir";
}

export function getRoleDisplayName(role?: string | null): string {
  if (isAdminRole(role)) return "Admin / Owner";
  return "Pegawai / Kasir";
}

/**
 * Standarisasi nomor telepon/WA menjadi format 628...
 */
export function normalizeWaPhone(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0062")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }
  return digits;
}

export function formatMoney(n: number | string | undefined | null): string {
  const val = Math.round(Number(n || 0));
  return "Rp " + val.toLocaleString("id-ID");
}

export function getInitials(name?: string | null): string {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

export function toYmd(dateStr?: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function formatTimeShort(dateStr?: string | null): string {
  if (!dateStr || dateStr.length <= 10) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWaNotifiedAt(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const datePart = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

export function formatYear(dateStr?: string | null): string {
  if (!dateStr) return "2026";
  return dateStr.slice(0, 4);
}

export function normalizeStatusLabel(status?: string | null): string {
  const s = (status || "").toLowerCase();
  if (s === "diterima" || s === "pending") return "Diterima";
  if (s === "diproses" || s === "washing" || s === "ironing") return "Diproses";
  if (s === "selesai" || s === "ready") return "Selesai";
  if (s === "diambil" || s === "completed") return "Diambil";
  if (s === "dibatalkan" || s === "cancelled") return "Dibatalkan";
  return "Diterima";
}

export function normalizePaymentMethod(
  method?: string | null
): "Tunai" | "QRIS" | "Transfer" {
  const m = (method || "").toLowerCase();
  if (m === "qris" || m === "ewallet") return "QRIS";
  if (m === "transfer") return "Transfer";
  return "Tunai";
}

export function statusPillClass(label: string): string {
  const firstWord = label.toLowerCase().split(" ")[0];
  return `pill ${firstWord}`;
}

export function getServiceIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("express")) return "ϟ";
  if (lower.includes("setrika saja")) return "♧";
  if (lower.includes("bed") || lower.includes("selimut")) return "▧";
  if (lower.includes("sepatu")) return "⌁";
  if (lower.includes("dry")) return "◇";
  return "≈";
}

export function getOrderPaidAmount(order: Order): number {
  if (order.payments && order.payments.length > 0) {
    return order.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  }
  if (order.payment_status === "lunas" || order.payment_status === "paid") {
    return Number(order.final_price || order.total_price || 0);
  }
  return 0;
}

export function getOrderTotal(order: Order): number {
  return Number(order.final_price ?? order.total_price ?? 0);
}

export function formatOrderCode(order: Order): string {
  if (!order.order_number) return `#BL-${order.id}`;
  return order.order_number.startsWith("#")
    ? order.order_number
    : `#${order.order_number}`;
}

export interface OrderAlertInfo {
  type: AlertStatusType;
  badgeText: string;
  pillClass: string;
  detailText: string;
}

/**
 * Mengevaluasi indikator Smart Alert untuk sebuah pesanan:
 * - Overdue (Terlambat): status Diterima/Diproses & lewat estimated_done_at
 * - Due Soon (Segera Selesai < 6 Jam): status Diterima/Diproses & sisa <= 6 jam
 * - Unclaimed / Unpaid: status Selesai (belum diambil atau belum lunas)
 */
export function getOrderAlertInfo(order: Order): OrderAlertInfo | null {
  const statusLabel = normalizeStatusLabel(order.status);
  const dueRaw = order.estimated_done_at || order.estimated_completion_date;

  if (statusLabel === "Diterima" || statusLabel === "Diproses") {
    if (dueRaw) {
      const dueDate = new Date(
        dueRaw.length <= 10 ? `${dueRaw}T23:59:59` : dueRaw
      );
      const now = new Date();
      const diffMs = dueDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0 || order.alert_status === "overdue") {
        const overdueHours = Math.max(1, Math.round(Math.abs(diffHours)));
        return {
          type: "overdue",
          badgeText: "Terlambat",
          pillClass: "pill overdue",
          detailText:
            overdueHours >= 24
              ? `Lewat ${Math.round(overdueHours / 24)} hari`
              : `Lewat ${overdueHours} jam`,
        };
      }

      if (
        (diffHours >= 0 && diffHours <= 6) ||
        order.alert_status === "due_soon"
      ) {
        const remHours = Math.max(1, Math.ceil(diffHours));
        return {
          type: "due_soon",
          badgeText: "Segera Selesai",
          pillClass: "pill due-soon",
          detailText: `Sisa ~${remHours} jam lagi`,
        };
      }
    }
  }

  if (statusLabel === "Selesai") {
    const paid = getOrderPaidAmount(order);
    const total = getOrderTotal(order);
    const isUnpaid = paid < total;
    return {
      type: "unclaimed_or_unpaid",
      badgeText: isUnpaid ? "Belum Lunas & Belum Diambil" : "Belum Diambil",
      pillClass: isUnpaid ? "pill belum" : "pill selesai",
      detailText: isUnpaid
        ? `Kurang ${formatMoney(total - paid)}`
        : "Siap diserahkan ke pelanggan",
    };
  }

  return null;
}

export function buildWhatsAppOrderUrl(order: Order): string {
  const phone = normalizeWaPhone(order.customer?.phone);
  if (!phone) return "#";
  const code = formatOrderCode(order);
  const firstItem = order.items?.[0];
  const serviceName = firstItem?.service?.name || "Layanan Laundry";
  const qty = firstItem
    ? `${Number(firstItem.quantity)} ${firstItem.service?.unit || "kg"}`
    : "-";
  const total = formatMoney(getOrderTotal(order));
  const paid = getOrderPaidAmount(order);
  const remaining = Math.max(0, getOrderTotal(order) - paid);
  const statusLabel = normalizeStatusLabel(order.status);
  const payLabel =
    remaining <= 0 ? "Lunas" : `Belum Lunas (Sisa ${formatMoney(remaining)})`;

  const message = [
    `Halo Kak *${order.customer?.name || "Pelanggan"}*,`,
    `Berikut informasi pesanan laundry Anda di *Bilas Laundry*:`,
    ``,
    `• No. Nota: *${code}*`,
    `• Layanan: ${serviceName} (${qty})`,
    `• Status Cucian: *${statusLabel}*`,
    `• Total Biaya: *${total}*`,
    `• Status Bayar: ${payLabel}`,
    order.notes ? `• Catatan: ${order.notes}` : null,
    ``,
    statusLabel === "Selesai"
      ? `Cucian Anda sudah *SELESAI* dan siap diambil di outlet kami. Terima kasih!`
      : `Terima kasih telah mempercayakan cucian Anda kepada Bilas Laundry!`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppCustomerUrl(
  phone?: string | null,
  name?: string | null
): string {
  const normalized = normalizeWaPhone(phone);
  if (!normalized) return "#";
  const text = `Halo Kak ${name || ""}, kami dari Bilas Laundry.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
