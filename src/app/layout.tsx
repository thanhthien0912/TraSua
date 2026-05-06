import type { Metadata } from "next";
import ToastProvider from "@/components/ui/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraSua - Đặt Món",
  description:
    "Hệ thống quản lý và đặt món trà sữa — nhanh chóng, tiện lợi, dễ sử dụng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
