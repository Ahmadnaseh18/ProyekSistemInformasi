"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  clearStoredAuth,
  Customer,
  ExecutiveSummaryData,
  getStoredToken,
  getStoredUser,
  Order,
  Payment,
  Service,
  setStoredAuth,
  SmartAlertsData,
  User,
} from "../lib/api";
import {
  buildWhatsAppOrderUrl,
  formatDateShort,
  formatMoney,
  formatOrderCode,
  formatTimeShort,
  formatWaNotifiedAt,
  formatYear,
  getOrderPaidAmount,
  getOrderTotal,
  isAdminRole,
  normalizeStatusLabel,
  normalizeWaPhone,
  STATUS_STEPS,
  statusPillClass,
  toYmd,
} from "../lib/utils";

interface LaundryContextValue {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  authChecked: boolean;
  orders: Order[];
  customers: Customer[];
  services: Service[];
  payments: Payment[];
  staffList: User[];
  smartAlerts: SmartAlertsData | null;
  executiveSummary: ExecutiveSummaryData | null;
  loading: boolean;
  submitting: boolean;
  referenceToday: string;
  autoNotifyWaOnSelesai: boolean;
  setAutoNotifyWaOnSelesai: React.Dispatch<React.SetStateAction<boolean>>;
  notify: (msg: string) => void;
  fetchAllData: (userOverride?: User | null) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleAdvanceStatus: (order: Order) => Promise<void>;
  handleNotifyWa: (order: Order) => Promise<void>;
  openNewOrderModal: () => void;
  openDetailModal: (orderId: number) => void;
  openPayModal: (order: Order) => void;
  openAddCustomerModal: () => void;
  openEditCustomerModal: (customer: Customer) => void;
  handleDeleteCustomer: (customer: Customer) => Promise<void>;
  openCustomerHistoryModal: (customerId: number) => void;
  openServiceModal: (service?: Service) => void;
  exportCSV: (rowsToExport?: Order[]) => void;
}

const LaundryContext = createContext<LaundryContextValue | null>(null);

export function useLaundry(): LaundryContextValue {
  const ctx = useContext(LaundryContext);
  if (!ctx) {
    throw new Error("useLaundry must be used inside LaundryProvider");
  }
  return ctx;
}

export function LaundryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoNotifyWaOnSelesai, setAutoNotifyWaOnSelesai] =
    useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlertsData | null>(null);
  const [executiveSummary, setExecutiveSummary] =
    useState<ExecutiveSummaryData | null>(null);

  // Modal states
  const [modalType, setModalType] = useState<
    | null
    | "newOrder"
    | "orderDetail"
    | "payOrder"
    | "customerForm"
    | "customerHistory"
    | "serviceForm"
  >(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // New Order (Kasir) form state
  const [isNewCustomerInOrder, setIsNewCustomerInOrder] = useState(false);
  const [orderCustomerSearch, setOrderCustomerSearch] = useState("");
  const [orderCustomerId, setOrderCustomerId] = useState<number>(0);
  const [inlineCustomerName, setInlineCustomerName] = useState("");
  const [inlineCustomerPhone, setInlineCustomerPhone] = useState("");
  const [inlineCustomerAddress, setInlineCustomerAddress] = useState("");
  const [inlineCustomerNotes, setInlineCustomerNotes] = useState("");

  const [orderServiceId, setOrderServiceId] = useState<number>(0);
  const [orderQty, setOrderQty] = useState<string>("1");
  const [orderDate, setOrderDate] = useState<string>("2026-10-18");
  const [orderDue, setOrderDue] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Payment form state
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("Tunai");
  const [payDate, setPayDate] = useState<string>("2026-10-18");

  // Customer form state (Add / Edit)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Service form state
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("8000");
  const [serviceUnit, setServiceUnit] = useState("kg");
  const [serviceDays, setServiceDays] = useState("2");

  const notify = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const fetchAllData = useCallback(
    async (userOverride?: User | null) => {
      const token = getStoredToken();
      if (!token) return;

      const activeUser = userOverride ?? currentUser ?? getStoredUser();
      setLoading(true);
      try {
        const promises: [
          Promise<{ data: Order[] }>,
          Promise<{ data: Customer[] }>,
          Promise<{ data: Service[] }>,
          Promise<{ data: Payment[] }>,
          Promise<{
            data: {
              smart_alerts?: SmartAlertsData;
              executive_summary?: ExecutiveSummaryData;
            };
          }>,
          Promise<{ data: User[] }>
        ] = [
          apiRequest<{ data: Order[] }>("/orders"),
          apiRequest<{ data: Customer[] }>("/customers"),
          apiRequest<{ data: Service[] }>("/services"),
          apiRequest<{ data: Payment[] }>("/payments"),
          apiRequest<{
            data: {
              smart_alerts?: SmartAlertsData;
              executive_summary?: ExecutiveSummaryData;
            };
          }>("/dashboard").catch(() => ({ data: {} })),
          isAdminRole(activeUser?.role)
            ? apiRequest<{ data: User[] }>("/staff").catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ];

        const [
          ordersRes,
          customersRes,
          servicesRes,
          paymentsRes,
          dashRes,
          staffRes,
        ] = await Promise.all(promises);

        setOrders(ordersRes.data || []);
        setCustomers(customersRes.data || []);
        setServices(servicesRes.data || []);
        setPayments(paymentsRes.data || []);
        if (dashRes?.data?.smart_alerts) {
          setSmartAlerts(dashRes.data.smart_alerts);
        }
        if (dashRes?.data?.executive_summary) {
          setExecutiveSummary(dashRes.data.executive_summary);
        }
        setStaffList(staffRes.data || []);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    let mounted = true;
    async function verifySession() {
      const token = getStoredToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        clearStoredAuth();
        if (mounted) {
          setCurrentUser(null);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const meRes = await apiRequest<{ data: User }>("/me");
        const verifiedUser = meRes.data;
        setStoredAuth(token, verifiedUser);
        if (mounted) {
          setCurrentUser(verifiedUser);
          setAuthChecked(true);
        }
        await fetchAllData(verifiedUser);
      } catch {
        clearStoredAuth();
        if (mounted) {
          setCurrentUser(null);
          setAuthChecked(true);
        }
      }
    }
    verifySession();
    return () => {
      mounted = false;
    };
  }, [fetchAllData]);

  const handleLogout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await apiRequest("/logout", { method: "POST" });
      }
    } catch {
      // Ignore logout network error
    } finally {
      clearStoredAuth();
      setCurrentUser(null);
      setOrders([]);
      setCustomers([]);
      setServices([]);
      setPayments([]);
      setStaffList([]);
      setSmartAlerts(null);
      setExecutiveSummary(null);
      setModalType(null);
      router.replace("/login");
      notify("Anda telah keluar dari sistem.");
    }
  }, [router, notify]);

  const referenceToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (orders.some((o) => toYmd(o.order_date) === todayStr)) {
      return todayStr;
    }
    if (orders.length > 0) {
      return toYmd(orders[0].order_date) || todayStr;
    }
    return todayStr;
  }, [orders]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const matchingCustomersForOrder = useMemo(() => {
    const q = orderCustomerSearch.trim().toLowerCase();
    const normQ = normalizeWaPhone(q);
    if (!q) return customers;
    return customers.filter((c) => {
      const textMatch = `${c.name} ${c.phone} ${c.address || ""} ${
        c.notes || ""
      }`
        .toLowerCase()
        .includes(q);
      const waMatch = normQ.length >= 3 && c.phone.includes(normQ);
      return textMatch || waMatch;
    });
  }, [customers, orderCustomerSearch]);

  const selectedExistingCustomerInOrder = useMemo(
    () => customers.find((c) => c.id === orderCustomerId) || null,
    [customers, orderCustomerId]
  );

  const handleSelectCustomerInOrder = useCallback(
    (custId: number) => {
      setOrderCustomerId(custId);
      const found = customers.find((c) => c.id === custId);
      if (found) {
        setOrderNotes(found.notes || "");
      }
    },
    [customers]
  );

  const openNewOrderModal = useCallback(() => {
    const defaultCust = customers[0] || null;
    const defaultSrv = services[0] || null;
    const defaultDate = new Date().toISOString().slice(0, 10);

    setIsNewCustomerInOrder(false);
    setOrderCustomerSearch("");
    setOrderCustomerId(defaultCust?.id || 0);
    setInlineCustomerName("");
    setInlineCustomerPhone("");
    setInlineCustomerAddress("");
    setInlineCustomerNotes("");
    setOrderNotes(defaultCust?.notes || "");

    setOrderServiceId(defaultSrv?.id || 0);
    setOrderQty("1");
    setOrderDate(defaultDate);
    setOrderDue("");
    setModalType("newOrder");
  }, [customers, services]);

  const selectedServiceForNewOrder = useMemo(
    () => services.find((s) => s.id === orderServiceId) || services[0] || null,
    [services, orderServiceId]
  );

  const calculatedNewOrderTotal = useMemo(() => {
    if (!selectedServiceForNewOrder) return 0;
    return Math.round(
      Number(selectedServiceForNewOrder.price || 0) * Number(orderQty || 0)
    );
  }, [selectedServiceForNewOrder, orderQty]);

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderServiceId) {
      notify("Pilih layanan terlebih dahulu");
      return;
    }

    if (isNewCustomerInOrder) {
      if (!inlineCustomerName.trim() || !inlineCustomerPhone.trim()) {
        notify("Nama dan Nomor WhatsApp pelanggan baru wajib diisi");
        return;
      }
    } else if (!orderCustomerId) {
      notify("Pilih pelanggan terlebih dahulu");
      return;
    }

    if (orderDue && orderDue < orderDate) {
      notify("Estimasi selesai tidak boleh sebelum tanggal masuk");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        order_date: orderDate,
        ...(orderDue ? { estimated_done_at: orderDue } : {}),
        status: "diterima",
        payment_status: "belum_lunas",
        notes:
          (isNewCustomerInOrder
            ? inlineCustomerNotes.trim() || orderNotes.trim()
            : orderNotes.trim()) || null,
        items: [
          {
            service_id: orderServiceId,
            quantity: Number(orderQty),
          },
        ],
      };

      if (isNewCustomerInOrder) {
        payload.new_customer = {
          name: inlineCustomerName.trim(),
          phone: inlineCustomerPhone.trim(),
          address: inlineCustomerAddress.trim() || null,
          notes: inlineCustomerNotes.trim() || null,
        };
      } else {
        payload.customer_id = orderCustomerId;
      }

      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await fetchAllData();
      setModalType(null);
      router.push("/orders");
      notify(
        isNewCustomerInOrder
          ? "Pelanggan baru & pesanan berhasil disimpan ke database"
          : "Pesanan baru berhasil disimpan ke database"
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal menyimpan pesanan");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setModalType("orderDetail");
  }, []);

  /**
   * Memanggil endpoint POST /api/orders/{id}/notify-wa, memperbarui badge wa_notified_at,
   * dan membuka wa_link di tab baru untuk mengirim pesan WhatsApp ke pelanggan.
   */
  const handleNotifyWa = useCallback(
    async (order: Order) => {
      setSubmitting(true);
      try {
        const res = await apiRequest<{
          message?: string;
          data: {
            wa_link: string;
            wa_notified_at: string;
            gateway_sent: boolean;
            order?: Order;
          };
        }>(`/orders/${order.id}/notify-wa`, {
          method: "POST",
        });

        await fetchAllData();
        notify(
          res.message ||
            `Notifikasi WA untuk ${formatOrderCode(order)} berhasil disiapkan`
        );

        if (res.data?.wa_link && typeof window !== "undefined") {
          window.open(res.data.wa_link, "_blank", "noopener,noreferrer");
        }
      } catch (err) {
        notify(
          err instanceof Error
            ? err.message
            : "Gagal memproses notifikasi WhatsApp"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAllData, notify]
  );

  const handleAdvanceStatus = useCallback(
    async (order: Order) => {
      const currentLabel = normalizeStatusLabel(order.status);
      const paid = getOrderPaidAmount(order);
      const total = getOrderTotal(order);

      if (currentLabel === "Selesai" && paid < total) {
        notify("Lunasi pembayaran sebelum konfirmasi pengambilan");
        return;
      }

      const idx = STATUS_STEPS.indexOf(
        currentLabel as (typeof STATUS_STEPS)[number]
      );
      if (idx < 0 || idx >= STATUS_STEPS.length - 1) return;

      const nextStatusLabel = STATUS_STEPS[idx + 1];
      const nextStatusApi = nextStatusLabel.toLowerCase();
      const shouldAutoWa =
        nextStatusLabel === "Selesai" && autoNotifyWaOnSelesai;

      setSubmitting(true);
      try {
        const res = await apiRequest<{
          data: Order;
          wa_notification?: {
            wa_link?: string;
            wa_notified_at?: string;
            gateway_sent?: boolean;
          } | null;
        }>(`/orders/${order.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatusApi,
            auto_notify_wa: shouldAutoWa,
          }),
        });

        await fetchAllData();

        if (shouldAutoWa && res.wa_notification?.wa_link) {
          notify(
            `Status ${formatOrderCode(
              order
            )} diubah ke Selesai & membuka WhatsApp pelanggan...`
          );
          if (typeof window !== "undefined") {
            window.open(
              res.wa_notification.wa_link,
              "_blank",
              "noopener,noreferrer"
            );
          }
        } else {
          notify(
            `Status pesanan ${formatOrderCode(
              order
            )} diperbarui menjadi ${nextStatusLabel}`
          );
        }
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Gagal memperbarui status"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [autoNotifyWaOnSelesai, fetchAllData, notify]
  );

  const openPayModal = useCallback(
    (order: Order) => {
      const remaining = Math.max(
        0,
        getOrderTotal(order) - getOrderPaidAmount(order)
      );
      setSelectedOrderId(order.id);
      setPayAmount(String(remaining));
      setPayMethod("Tunai");
      setPayDate(referenceToday);
      setModalType("payOrder");
    },
    [referenceToday]
  );

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const amount = Number(payAmount);
    const remaining = Math.max(
      0,
      getOrderTotal(selectedOrder) - getOrderPaidAmount(selectedOrder)
    );
    if (amount <= 0 || amount > remaining) {
      notify("Nominal pembayaran tidak valid");
      return;
    }

    const methodMap: Record<string, string> = {
      Tunai: "tunai",
      Transfer: "transfer",
      QRIS: "qris",
    };

    setSubmitting(true);
    try {
      await apiRequest(`/orders/${selectedOrder.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          payment_method: methodMap[payMethod] || "cash",
          payment_date: payDate,
        }),
      });
      await fetchAllData();
      setModalType(null);
      notify("Pembayaran berhasil dicatat ke database");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal mencatat pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddCustomerModal = useCallback(() => {
    setEditingCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerNotes("");
    setModalType("customerForm");
  }, []);

  const openEditCustomerModal = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerAddress(customer.address || "");
    setCustomerNotes(customer.notes || "");
    setModalType("customerForm");
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    const payload = {
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim() || null,
      notes: customerNotes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editingCustomer) {
        await apiRequest(`/customers/${editingCustomer.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notify("Data & catatan pelanggan berhasil diperbarui");
      } else {
        await apiRequest("/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify("Pelanggan baru berhasil ditambahkan");
      }
      await fetchAllData();
      setModalType(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal menyimpan pelanggan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = useCallback(
    async (customer: Customer) => {
      try {
        await apiRequest(`/customers/${customer.id}`, {
          method: "DELETE",
        });
        await fetchAllData();
        notify(`Pelanggan ${customer.name} berhasil dihapus`);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Gagal menghapus pelanggan"
        );
      }
    },
    [fetchAllData, notify]
  );

  const openCustomerHistoryModal = useCallback((customerId: number) => {
    setSelectedCustomerId(customerId);
    setModalType("customerHistory");
  }, []);

  const openServiceModal = useCallback((service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServicePrice(String(Math.round(Number(service.price))));
      setServiceUnit(service.unit);
      const days = service.estimated_duration
        ? Math.max(1, Math.round(Number(service.estimated_duration) / 24))
        : 2;
      setServiceDays(String(days));
    } else {
      setEditingService(null);
      setServiceName("");
      setServicePrice("8000");
      setServiceUnit("kg");
      setServiceDays("2");
    }
    setModalType("serviceForm");
  }, []);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const payload = {
      name: serviceName.trim(),
      price: Number(servicePrice),
      unit: serviceUnit,
      estimated_duration: Math.max(1, Number(serviceDays)) * 24,
      is_active: true,
    };

    setSubmitting(true);
    try {
      if (editingService) {
        await apiRequest(`/services/${editingService.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/services", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await fetchAllData();
      setModalType(null);
      notify("Layanan berhasil disimpan");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal menyimpan layanan");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = useCallback(
    (rowsToExport?: Order[]) => {
      const rows = rowsToExport ?? orders;
      const cell = (v: unknown) =>
        '"' +
        String(v ?? "")
          .replace(/^[=+@-]/, "'$&")
          .replace(/"/g, '""') +
        '"';

      const header = [
        "Nomor",
        "Pelanggan",
        "No. WhatsApp",
        "Tanggal masuk",
        "Layanan",
        "Jumlah",
        "Total pesanan",
        "Total dibayar saat ini",
        "Sisa",
        "Status",
        "Notifikasi WA",
      ];

      const bodyRows = rows.map((o) => {
        const firstItem = o.items?.[0];
        const serviceNameStr = firstItem?.service?.name || "Layanan Laundry";
        const qtyStr = firstItem
          ? `${Number(firstItem.quantity)} ${firstItem.service?.unit || "kg"}`
          : "-";
        const total = getOrderTotal(o);
        const paid = getOrderPaidAmount(o);
        return [
          o.order_number,
          o.customer?.name || "-",
          o.customer?.phone || "-",
          toYmd(o.order_date),
          serviceNameStr,
          qtyStr,
          total,
          paid,
          Math.max(0, total - paid),
          normalizeStatusLabel(o.status),
          o.wa_notified_at ? formatWaNotifiedAt(o.wa_notified_at) : "Belum",
        ];
      });

      const csv =
        "\ufeff" +
        [header, ...bodyRows].map((r) => r.map(cell).join(",")).join("\r\n");

      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" })
      );
      a.download = "laporan-bilas.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      notify("Laporan CSV diunduh");
    },
    [orders, notify]
  );

  return (
    <LaundryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authChecked,
        orders,
        customers,
        services,
        payments,
        staffList,
        smartAlerts,
        executiveSummary,
        loading,
        submitting,
        referenceToday,
        autoNotifyWaOnSelesai,
        setAutoNotifyWaOnSelesai,
        notify,
        fetchAllData,
        handleLogout,
        handleAdvanceStatus,
        handleNotifyWa,
        openNewOrderModal,
        openDetailModal,
        openPayModal,
        openAddCustomerModal,
        openEditCustomerModal,
        handleDeleteCustomer,
        openCustomerHistoryModal,
        openServiceModal,
        exportCSV,
      }}
    >
      {children}

      {/* GLOBAL MODALS */}
      {modalType && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalType(null);
          }}
        >
          <div className="modal-box" role="dialog" aria-modal="true">
            {/* MODAL 1: FORM KASIR / INPUT PESANAN BARU */}
            {modalType === "newOrder" && (
              <>
                <div className="dialog-head">
                  <h2>Buat pesanan baru (Kasir)</h2>
                  <button
                    className="ghost"
                    aria-label="Tutup dialog"
                    onClick={() => setModalType(null)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSaveOrder}>
                  <div className="form-grid">
                    <div className="wide">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <strong style={{ fontSize: 12 }}>
                          Data Pelanggan
                        </strong>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className={`small ${
                              !isNewCustomerInOrder ? "primary" : ""
                            }`}
                            onClick={() => setIsNewCustomerInOrder(false)}
                          >
                            Cari Pelanggan Lama
                          </button>
                          <button
                            type="button"
                            className={`small ${
                              isNewCustomerInOrder ? "primary" : ""
                            }`}
                            onClick={() => setIsNewCustomerInOrder(true)}
                          >
                            ＋ Pelanggan Baru
                          </button>
                        </div>
                      </div>

                      {!isNewCustomerInOrder ? (
                        <div
                          style={{
                            background: "#f8faf9",
                            border: "1px solid var(--line)",
                            borderRadius: 10,
                            padding: 14,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <input
                            type="text"
                            placeholder="⌕ Ketik nama atau nomor WA (08... / 628...) untuk mencari cepat…"
                            value={orderCustomerSearch}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOrderCustomerSearch(val);
                              const q = val.trim().toLowerCase();
                              const normQ = normalizeWaPhone(q);
                              const firstMatch = customers.find(
                                (c) =>
                                  `${c.name} ${c.phone}`
                                    .toLowerCase()
                                    .includes(q) ||
                                  (normQ.length >= 3 &&
                                    c.phone.includes(normQ))
                              );
                              if (firstMatch) {
                                handleSelectCustomerInOrder(firstMatch.id);
                              }
                            }}
                          />

                          <select
                            value={orderCustomerId}
                            onChange={(e) =>
                              handleSelectCustomerInOrder(
                                Number(e.target.value)
                              )
                            }
                          >
                            {matchingCustomersForOrder.length > 0 ? (
                              matchingCustomersForOrder.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} · WA: {c.phone} (
                                  {c.orders_count ?? 0} pesanan)
                                </option>
                              ))
                            ) : (
                              <option value={0}>
                                -- Pelanggan tidak ditemukan (Klik + Pelanggan
                                Baru) --
                              </option>
                            )}
                          </select>

                          {selectedExistingCustomerInOrder && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--ink)",
                                background: "#eef6f2",
                                padding: "10px 12px",
                                borderRadius: 8,
                                lineHeight: 1.5,
                              }}
                            >
                              <div>
                                <b>{selectedExistingCustomerInOrder.name}</b> ·
                                WA:{" "}
                                <code>
                                  {selectedExistingCustomerInOrder.phone}
                                </code>
                                {selectedExistingCustomerInOrder.address
                                  ? ` · ${selectedExistingCustomerInOrder.address}`
                                  : ""}
                              </div>
                              {selectedExistingCustomerInOrder.notes && (
                                <div
                                  style={{
                                    color: "var(--teal)",
                                    marginTop: 4,
                                    fontWeight: 600,
                                  }}
                                >
                                  ✦ Preferensi Pelanggan:{" "}
                                  {selectedExistingCustomerInOrder.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "#f8faf9",
                            border: "1px solid var(--line)",
                            borderRadius: 10,
                            padding: 14,
                          }}
                        >
                          <div className="form-grid">
                            <label>
                              Nama pelanggan baru *
                              <input
                                type="text"
                                placeholder="Contoh: Rina Kartika"
                                value={inlineCustomerName}
                                onChange={(e) =>
                                  setInlineCustomerName(e.target.value)
                                }
                                required={isNewCustomerInOrder}
                              />
                            </label>
                            <label>
                              Nomor WhatsApp *
                              <input
                                type="tel"
                                placeholder="0812-xxxx-xxxx"
                                value={inlineCustomerPhone}
                                onChange={(e) =>
                                  setInlineCustomerPhone(e.target.value)
                                }
                                required={isNewCustomerInOrder}
                              />
                              {inlineCustomerPhone && (
                                <small
                                  style={{
                                    fontSize: 10,
                                    color: "var(--teal)",
                                    fontWeight: 500,
                                  }}
                                >
                                  Standar WA:{" "}
                                  {normalizeWaPhone(inlineCustomerPhone)}
                                </small>
                              )}
                            </label>
                            <label className="wide">
                              Alamat pelanggan
                              <input
                                type="text"
                                placeholder="Jl. Contoh No. 10 (Opsional)"
                                value={inlineCustomerAddress}
                                onChange={(e) =>
                                  setInlineCustomerAddress(e.target.value)
                                }
                              />
                            </label>
                            <label className="wide">
                              Catatan khusus / preferensi parfum pelanggan
                              <input
                                type="text"
                                placeholder="Contoh: Parfum Sakura, jangan disetrika suhu tinggi"
                                value={inlineCustomerNotes}
                                onChange={(e) => {
                                  setInlineCustomerNotes(e.target.value);
                                  setOrderNotes(e.target.value);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <label>
                      Layanan
                      <select
                        value={orderServiceId}
                        onChange={(e) =>
                          setOrderServiceId(Number(e.target.value))
                        }
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({formatMoney(s.price)}/{s.unit} ·{" "}
                            {s.estimated_hours ?? s.estimated_duration ?? 24}{" "}
                            jam)
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Berat / jumlah ({selectedServiceForNewOrder?.unit || "kg"}
                      )
                      <input
                        type="number"
                        min={
                          selectedServiceForNewOrder?.unit === "kg"
                            ? "0.1"
                            : "1"
                        }
                        step={
                          selectedServiceForNewOrder?.unit === "kg"
                            ? "0.1"
                            : "1"
                        }
                        value={orderQty}
                        onChange={(e) => setOrderQty(e.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Tanggal masuk
                      <input
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Estimasi selesai (Opsional — Otomatis{" "}
                      {selectedServiceForNewOrder?.estimated_hours ??
                        selectedServiceForNewOrder?.estimated_duration ??
                        48}{" "}
                      jam)
                      <input
                        type="datetime-local"
                        value={orderDue}
                        onChange={(e) => setOrderDue(e.target.value)}
                      />
                    </label>

                    <label className="wide">
                      Catatan pesanan / instruksi pencucian
                      <input
                        type="text"
                        placeholder="Terisi otomatis dari preferensi pelanggan atau tambahkan catatan baru"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                      />
                    </label>

                    <div className="wide total-box">
                      <span>Total biaya otomatis</span>
                      <strong>{formatMoney(calculatedNewOrderTotal)}</strong>
                    </div>
                  </div>
                  <p className="footnote">
                    Jika Estimasi Selesai dikosongkan, sistem backend otomatis
                    menghitung <code>estimated_done_at</code> berdasarkan{" "}
                    <code>estimated_hours</code> terlama dari layanan yang
                    dipilih.
                  </p>
                  <div className="form-actions">
                    <button type="button" onClick={() => setModalType(null)}>
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="primary"
                      disabled={submitting}
                    >
                      {submitting ? "Menyimpan..." : "Simpan pesanan"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* MODAL 2: DETAIL NOTA PESANAN & NOTIFIKASI WHATSAPP */}
            {modalType === "orderDetail" && selectedOrder && (
              <>
                <div className="dialog-head">
                  <div>
                    <h2>Pesanan {formatOrderCode(selectedOrder)}</h2>
                    {selectedOrder.wa_notified_at && (
                      <span
                        className="pill wa-sent"
                        style={{ marginTop: 6 }}
                      >
                        ✓ WA Terkirim (
                        {formatWaNotifiedAt(selectedOrder.wa_notified_at)})
                      </span>
                    )}
                  </div>
                  <button
                    className="ghost"
                    aria-label="Tutup dialog"
                    onClick={() => setModalType(null)}
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const firstItem = selectedOrder.items?.[0];
                  const srvName =
                    firstItem?.service?.name || "Layanan Laundry";
                  const srvUnit = firstItem?.service?.unit || "kg";
                  const qty = firstItem ? Number(firstItem.quantity) : 1;
                  const total = getOrderTotal(selectedOrder);
                  const paid = getOrderPaidAmount(selectedOrder);
                  const remaining = Math.max(0, total - paid);
                  const statusLabel = normalizeStatusLabel(
                    selectedOrder.status
                  );
                  const currentStepIdx = STATUS_STEPS.indexOf(
                    statusLabel as (typeof STATUS_STEPS)[number]
                  );
                  const orderPayments = selectedOrder.payments || [];
                  const dueRaw =
                    selectedOrder.estimated_done_at ||
                    selectedOrder.estimated_completion_date;
                  const dueTime = formatTimeShort(dueRaw);

                  return (
                    <>
                      <div className="detail-grid">
                        <div>
                          <small>Pelanggan & WhatsApp</small>
                          <b>{selectedOrder.customer?.name || "-"}</b>
                          <p className="sub">
                            WA: {selectedOrder.customer?.phone || "-"}
                          </p>
                        </div>
                        <div>
                          <small>Layanan</small>
                          <b>{srvName}</b>
                          <p className="sub">
                            {qty} {srvUnit} · {formatMoney(total)}
                          </p>
                        </div>
                        <div>
                          <small>Tanggal masuk</small>
                          {formatDateShort(selectedOrder.order_date)}{" "}
                          {formatYear(selectedOrder.order_date)}
                        </div>
                        <div>
                          <small>Estimasi selesai</small>
                          {formatDateShort(dueRaw)} {formatYear(dueRaw)}{" "}
                          {dueTime ? `(${dueTime})` : ""}
                        </div>
                      </div>

                      {(selectedOrder.notes ||
                        selectedOrder.customer?.notes) && (
                        <div
                          className="hint"
                          style={{ marginTop: 0, marginBottom: 16 }}
                        >
                          ✦ <b>Catatan / Preferensi:</b>{" "}
                          {selectedOrder.notes ||
                            selectedOrder.customer?.notes}
                        </div>
                      )}

                      <div className="stepper">
                        {STATUS_STEPS.map((st, idx) => (
                          <span
                            key={st}
                            className={idx <= currentStepIdx ? "done" : ""}
                          >
                            {st}
                          </span>
                        ))}
                      </div>

                      <div className="total-box">
                        <span>Sisa pembayaran</span>
                        <strong>{formatMoney(remaining)}</strong>
                      </div>

                      <h3 style={{ marginTop: 24 }}>Riwayat pembayaran</h3>
                      {orderPayments.length > 0 ? (
                        orderPayments.map((p) => (
                          <p key={p.id} className="sub">
                            {formatDateShort(p.payment_date)} ·{" "}
                            {p.payment_method.toUpperCase()} ·{" "}
                            {formatMoney(p.amount)}
                          </p>
                        ))
                      ) : (
                        <p className="sub">Belum ada pembayaran.</p>
                      )}

                      {/* OPSI CHECKBOX KIRIM WA OTOMATIS SAAT STATUS DIUBAH KE SELESAI */}
                      {(statusLabel === "Diterima" ||
                        statusLabel === "Diproses") && (
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 18,
                            padding: "10px 12px",
                            background: "#f4faf6",
                            borderRadius: 8,
                            border: "1px solid #d5ebe0",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={autoNotifyWaOnSelesai}
                            onChange={(e) =>
                              setAutoNotifyWaOnSelesai(e.target.checked)
                            }
                            style={{
                              width: 16,
                              height: 16,
                              margin: 0,
                              cursor: "pointer",
                            }}
                          />
                          <span>
                            Kirim notifikasi WA otomatis saat status diubah ke
                            Selesai
                          </span>
                        </label>
                      )}

                      <div
                        className="form-actions"
                        style={{ flexWrap: "wrap" }}
                      >
                        {selectedOrder.customer?.phone && (
                          <button
                            type="button"
                            className="wa-btn"
                            style={{ marginRight: "auto" }}
                            disabled={submitting}
                            onClick={() => handleNotifyWa(selectedOrder)}
                          >
                            💬 Kabari Siap Diambil (WA)
                          </button>
                        )}
                        {paid < total && (
                          <button
                            type="button"
                            onClick={() => openPayModal(selectedOrder)}
                          >
                            Catat pembayaran
                          </button>
                        )}
                        {statusLabel !== "Diambil" ? (
                          <button
                            type="button"
                            className="primary"
                            disabled={submitting}
                            onClick={() => handleAdvanceStatus(selectedOrder)}
                          >
                            {statusLabel === "Selesai"
                              ? "Konfirmasi diambil"
                              : `Lanjut: ${
                                  STATUS_STEPS[currentStepIdx + 1] || "Diproses"
                                }`}
                          </button>
                        ) : (
                          <span className="pill lunas">
                            ✓ Pesanan telah diserahkan
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            {/* MODAL 3: CATAT PEMBAYARAN */}
            {modalType === "payOrder" && selectedOrder && (
              <>
                <div className="dialog-head">
                  <h2>Catat pembayaran</h2>
                  <button
                    className="ghost"
                    aria-label="Tutup dialog"
                    onClick={() => setModalType(null)}
                  >
                    ✕
                  </button>
                </div>
                <p className="sub" style={{ marginBottom: 24 }}>
                  {formatOrderCode(selectedOrder)} ·{" "}
                  {selectedOrder.customer?.name}
                </p>
                <form onSubmit={handleSavePayment}>
                  {(() => {
                    const remaining = Math.max(
                      0,
                      getOrderTotal(selectedOrder) -
                        getOrderPaidAmount(selectedOrder)
                    );
                    return (
                      <div className="form-grid">
                        <label className="wide">
                          Nominal pembayaran (Rp)
                          <input
                            type="number"
                            min={1}
                            max={remaining}
                            step={1}
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            required
                          />
                        </label>
                        <label>
                          Metode
                          <select
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value)}
                          >
                            <option value="Tunai">Tunai</option>
                            <option value="Transfer">Transfer</option>
                            <option value="QRIS">QRIS</option>
                          </select>
                        </label>
                        <label>
                          Tanggal bayar
                          <input
                            type="date"
                            min={toYmd(selectedOrder.order_date)}
                            value={payDate}
                            onChange={(e) => setPayDate(e.target.value)}
                            required
                          />
                        </label>
                        <div className="total-box wide">
                          <span>Sisa tagihan saat ini</span>
                          <strong>{formatMoney(remaining)}</strong>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="form-actions">
                    <button type="button" onClick={() => setModalType(null)}>
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="primary"
                      disabled={submitting}
                    >
                      {submitting ? "Menyimpan..." : "Simpan pembayaran"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* MODAL 4: TAMBAH / EDIT PELANGGAN */}
            {modalType === "customerForm" && (
              <>
                <div className="dialog-head">
                  <h2>
                    {editingCustomer
                      ? "Edit data & catatan pelanggan"
                      : "Tambah pelanggan baru"}
                  </h2>
                  <button
                    className="ghost"
                    aria-label="Tutup dialog"
                    onClick={() => setModalType(null)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSaveCustomer}>
                  <div className="form-grid">
                    <label className="wide">
                      Nama pelanggan *
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        maxLength={60}
                        placeholder="Contoh: Budi Santoso"
                      />
                    </label>
                    <label className="wide">
                      Nomor WhatsApp * (Otomatis disimpan ke format 628...)
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        placeholder="Contoh: 0812-3456-7890 atau +62812..."
                      />
                      {customerPhone && (
                        <small
                          style={{
                            fontSize: 11,
                            color: "var(--teal)",
                            fontWeight: 600,
                          }}
                        >
                          Hasil Standarisasi WA:{" "}
                          <code>{normalizeWaPhone(customerPhone)}</code>
                        </small>
                      )}
                    </label>
                    <label className="wide">
                      Alamat pelanggan
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Jl. Merdeka No. 12, Jakarta"
                      />
                    </label>
                    <label className="wide">
                      Catatan khusus / preferensi pelanggan (Parfum, setrika,
                      dll)
                      <input
                        type="text"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Contoh: Parfum Sakura, pakaian putih dipisah, kemeja digantung"
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setModalType(null)}>
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="primary"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Menyimpan..."
                        : editingCustomer
                        ? "Simpan perubahan"
                        : "Simpan pelanggan"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* MODAL 5: RIWAYAT PESANAN PELANGGAN */}
            {modalType === "customerHistory" && selectedCustomer && (
              <>
                <div className="dialog-head">
                  <h2>Riwayat {selectedCustomer.name}</h2>
                  <button
                    className="ghost"
                    aria-label="Tutup dialog"
                    onClick={() => setModalType(null)}
                  >
                    ✕
                  </button>
                </div>
                <p className="sub">
                  WA: <b>{selectedCustomer.phone}</b>
                  {selectedCustomer.address
                    ? ` · ${selectedCustomer.address}`
                    : ""}
                </p>
                {selectedCustomer.notes && (
                  <div
                    className="hint"
                    style={{ marginTop: 12, marginBottom: 12 }}
                  >
                    ✦ <b>Catatan / Preferensi Pelanggan:</b>{" "}
                    {selectedCustomer.notes}
                  </div>
                )}
                <div style={{ marginTop: 18 }}>
                  {(() => {
                    const custOrders = orders.filter(
                      (o) => o.customer_id === selectedCustomer.id
                    );
                    if (custOrders.length === 0) {
                      return <p className="empty">Belum ada pesanan.</p>;
                    }
                    return custOrders.map((o) => {
                      const statusLabel = normalizeStatusLabel(o.status);
                      const srvName =
                        o.items?.[0]?.service?.name || "Layanan Laundry";
                      const paid = getOrderPaidAmount(o);
                      const total = getOrderTotal(o);
                      return (
                        <div
                          key={o.id}
                          className="card"
                          style={{ marginBottom: 12 }}
                        >
                          <div className="card-title">
                            <div>
                              <b>{formatOrderCode(o)}</b>
                              {o.wa_notified_at && (
                                <span
                                  className="pill wa-sent"
                                  style={{ marginLeft: 8 }}
                                >
                                  ✓ WA Terkirim (
                                  {formatWaNotifiedAt(o.wa_notified_at)})
                                </span>
                              )}
                            </div>
                            <span className={statusPillClass(statusLabel)}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="sub">
                            {formatDateShort(o.order_date)}{" "}
                            {formatYear(o.order_date)} · {srvName} ·{" "}
                            <b>{formatMoney(total)}</b> (
                            {paid >= total ? "Lunas" : "Belum lunas"})
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              marginTop: 10,
                            }}
                          >
                            <button
                              className="ghost small"
                              onClick={() => openDetailModal(o.id)}
                            >
                              Lihat detail pesanan →
                            </button>
                            <button
                              type="button"
                              className="small wa-btn"
                              disabled={submitting}
                              onClick={() => handleNotifyWa(o)}
                            >
                              💬 Kabari Siap Diambil (WA)
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* MODAL 6: FORM LAYANAN */}
            {modalType === "serviceForm" && (
              <>
                <div className="dialog-head">
                  <h2>{editingService ? "Ubah layanan" : "Layanan baru"}</h2>
                  <button
                    className="ghost"
                    aria-label="Tutup dialog"
                    onClick={() => setModalType(null)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSaveService}>
                  <div className="form-grid">
                    <label className="wide">
                      Nama layanan
                      <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        required
                        maxLength={40}
                      />
                    </label>
                    <label>
                      Harga (Rp)
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Satuan
                      <select
                        value={serviceUnit}
                        onChange={(e) => setServiceUnit(e.target.value)}
                      >
                        <option value="kg">kg</option>
                        <option value="pcs">pcs</option>
                        <option value="pasang">pasang</option>
                      </select>
                    </label>
                    <label className="wide">
                      Estimasi pengerjaan (hari)
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={serviceDays}
                        onChange={(e) => setServiceDays(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <p className="footnote">
                    Perubahan harga hanya berlaku untuk pesanan baru.
                  </p>
                  <div className="form-actions">
                    <button type="button" onClick={() => setModalType(null)}>
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="primary"
                      disabled={submitting}
                    >
                      {submitting ? "Menyimpan..." : "Simpan layanan"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </LaundryContext.Provider>
  );
}
