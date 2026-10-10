import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Financeiro",
  description: "Sistema financeiro",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen overflow-x-hidden bg-[#05090d] font-sans text-white">
        <Sidebar />

        <main className="relative z-10 min-h-screen w-full pt-16 lg:ml-[280px] lg:w-[calc(100vw-280px)] lg:pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}