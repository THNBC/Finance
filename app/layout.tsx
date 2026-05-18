// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanças",
  description: "App de controle financeiro pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} overflow-x-hidden bg-[#05090d] text-white antialiased`}
      >
        <div className="relative min-h-screen bg-[#05090d]">
          {/* Grid background */}
          <div className="pointer-events-none fixed inset-0 opacity-[0.04]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: "80px 80px",
              }}
            />
          </div>

          {/* Sidebar */}
          <Sidebar />

          {/* Content */}
          <main className="min-h-screen pl-[280px]">
            <div className="mx-auto max-w-[1500px] px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}