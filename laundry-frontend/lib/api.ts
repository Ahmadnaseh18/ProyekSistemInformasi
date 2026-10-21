export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'pegawai' | 'kasir' | 'owner' | string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  orders_count?: number;
  last_order_date?: string | null;
  total_spent?: number | string | null;
}

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  unit: string;
  price: number | string;
  estimated_duration?: number | null; // dalam jam (24 jam = 1 hari)
  estimated_hours?: number | null;
  is_active: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  service_id: number;
  quantity: number | string;
  price: number | string;
  subtotal: number | string;
  notes?: string | null;
  service?: Service;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number | string;
  payment_method: string;
  payment_date: string;
  status: string;
  reference_number?: string | null;
  notes?: string | null;
}

export type AlertStatusType = 'overdue' | 'due_soon' | 'unclaimed_or_unpaid' | null;

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  user_id?: number | null;
  order_date: string;
  estimated_completion_date?: string | null;
  estimated_done_at?: string | null;
  completed_date?: string | null;
  taken_date?: string | null;
  wa_notified_at?: string | null;
  total_price: number | string;
  discount: number | string;
  final_price: number | string;
  status: string;
  payment_status: string;
  alert_status?: AlertStatusType;
  notes?: string | null;
  customer?: Customer;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface SmartAlertsData {
  overdue_count: number;
  due_soon_count: number;
  unclaimed_or_unpaid_count: number;
  total_alerts_count: number;
  overdue: Order[];
  due_soon: Order[];
  unclaimed_or_unpaid: Order[];
}

export interface ExecutiveSummaryData {
  revenue_today: number;
  revenue_this_month: number;
  revenue_all_time: number;
  total_receivables: number;
  unpaid_orders_count: number;
  status_summary: {
    diterima: number;
    diproses: number;
    selesai_menunggu_diambil: number;
    selesai_diambil: number;
  };
}

export interface ReportPaymentMethodRow {
  payment_method: string;
  transactions_count: number;
  total_amount: number | string;
}

export interface ReportTopServiceRow {
  service_id: number;
  transactions_count: number;
  total_quantity: number | string;
  total_revenue: number | string;
  service?: Service;
}

export interface RevenueReportResponse {
  period: {
    start_date: string;
    end_date: string;
    payment_status?: string;
    payment_method?: string;
  };
  summary: {
    total_orders: number;
    paid_orders_count: number;
    unpaid_orders_count: number;
    gross_revenue: number;
    total_discount: number;
    net_revenue: number;
    cash_received?: number;
    unpaid_receivables: number;
  };
  payment_methods_breakdown: ReportPaymentMethodRow[];
  top_services: ReportTopServiceRow[];
  orders: Order[];
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const TOKEN_KEY = 'bilas_auth_token';
const USER_KEY = 'bilas_auth_user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      json?.message ||
      (json?.errors ? Object.values(json.errors).flat().join(', ') : null) ||
      `Request gagal (${res.status})`;
    throw new Error(errorMsg);
  }

  return json as T;
}
