import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
      <body
        className={`${inter.className} min-h-screen overflow-x-hidden bg-[#05090d] text-white`}
      >
        <Sidebar />

        <main className="relative z-10 ml-[280px] min-h-screen w-[calc(100vw-280px)]">
          {children}
        </main>
      </body>
    </html>
  );
}