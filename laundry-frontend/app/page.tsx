"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLaundry } from "../context/LaundryContext";
import { getStoredToken } from "../lib/api";

export default function RootRedirectPage() {
  const router = useRouter();
  const { authChecked, currentUser } = useLaundry();

  useEffect(() => {
    if (!authChecked) return;
    if (currentUser && getStoredToken()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [authChecked, currentUser, router]);

  return (
    <div className="empty" style={{ paddingTop: 120 }}>
      Mengarahkan halaman...
    </div>
  );
}
