// app/layout.tsx (hoặc layout.js/tsx)
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import { ServerProvider } from "@/contexts/ServerContext";
import Navbar from "@/components/navbar/Navbar";
import { SocketProvider } from "@/contexts/SocketContext";

const geistSans = localFont({
  src: "/fonts/Inter-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "/fonts/Inter-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hỗ trợ học tập | Tutor Support System | HCMUT-VNU",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
       className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SocketProvider>
          <ServerProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Navbar/>
              {children}
            </div>
          </ServerProvider>
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}
