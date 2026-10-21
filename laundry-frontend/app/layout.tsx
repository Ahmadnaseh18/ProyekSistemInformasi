import type { Metadata } from "next";
import "./globals.css";
import { LaundryProvider } from "../context/LaundryContext";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "Bilas — Laundry Management UI",
  description: "Sistem Informasi Manajemen Laundry Terintegrasi Laravel & Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <LaundryProvider>
          <AppShell>{children}</AppShell>
        </LaundryProvider>
      </body>
    </html>
  );
}
