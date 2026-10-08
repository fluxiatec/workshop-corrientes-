import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });

export const metadata: Metadata = {
  title: "¿Qué tarea te gustaría delegar? · Workshop",
  description: "Dinámica en vivo del workshop: compartí una tarea repetitiva, tediosa y digital.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#faf8ff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${geist.variable} ${geistMono.variable} ${bricolage.variable}`}>
      <body>
        {/* Configuración editable sin recompilar (public/config.js) */}
        <Script src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/config.js`} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
