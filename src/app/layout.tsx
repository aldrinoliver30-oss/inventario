import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import BarraInferior from "@/components/BarraInferior";
import PwaUpdater from "@/components/PwaUpdater";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventario",
  description: "Inventario de productos para vendedores y distribuidores",
  applicationName: "Inventario",
  appleWebApp: {
    capable: true,
    title: "Inventario",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f5f7", // barra del navegador del mismo color que el fondo
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ToastProvider>
          <main className="pb-nav mx-auto w-full max-w-md px-4">{children}</main>
          <Suspense
            fallback={
              <div className="bottom-safe fixed inset-x-0 bottom-0 h-16 border-t border-zinc-200/80 bg-white/90" />
            }
          >
            <BarraInferior />
          </Suspense>
          <PwaUpdater />
        </ToastProvider>
      </body>
    </html>
  );
}
