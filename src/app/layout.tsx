import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventario",
  description: "Inventario de productos con vencimientos y movimientos de stock",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 bg-emerald-700 text-white shadow">
          <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold">
              Inventario
            </Link>
            <Link href="/ajustes" className="text-sm font-medium hover:underline">
              Ajustes
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
