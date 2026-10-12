import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "¿Qué tarea te gustaría delegar? · IA en la práctica",
  description: "Dinámica en vivo del workshop: compartí una tarea repetitiva, tediosa y digital.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#190019",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${geistMono.variable}`}>
      <body>
        {/* Configuración editable sin recompilar (public/config.js) */}
        <Script src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/config.js`} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
