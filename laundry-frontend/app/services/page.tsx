"use client";

import React from "react";
import { useLaundry } from "../../context/LaundryContext";
import { formatMoney, getServiceIcon } from "../../lib/utils";

export default function ServicesPage() {
  const { services, openServiceModal } = useLaundry();

  return (
    <section>
      <div className="heading">
        <div>
          <div className="eyebrow">KATALOG</div>
          <h1>Layanan & harga</h1>
          <p className="sub">Tarif yang konsisten untuk setiap pesanan.</p>
        </div>
        <button className="primary" onClick={() => openServiceModal()}>
          ＋ Layanan baru
        </button>
      </div>

      <div className="service-grid">
        {services.map((s) => {
          const days = s.estimated_duration
            ? Math.max(1, Math.round(Number(s.estimated_duration) / 24))
            : 2;
          return (
            <div key={s.id} className="card">
              <div className="service-art">{getServiceIcon(s.name)}</div>
              <div className="card-title">
                <h2>{s.name}</h2>
                <span className="pill lunas">
                  {s.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="sub">Estimasi pengerjaan {days} hari</p>
              <div className="price">
                {formatMoney(s.price)} <small>/ {s.unit}</small>
              </div>
              <div className="divider"></div>
              <button
                style={{ width: "100%" }}
                onClick={() => openServiceModal(s)}
              >
                Ubah layanan
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

